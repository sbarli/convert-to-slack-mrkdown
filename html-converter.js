const fs = require('fs');
const util = require('util');
const readPromise = util.promisify(fs.readFile);
const writePromise = util.promisify(fs.writeFile);

const utils = require('./utils');

const getHTML = async () => {
  return await readPromise('./test-html.html', 'utf-8');
};

// const parseData = async (str) => {
//   let parsedStr = str;
//   // basic data (bold, italic, strikethrough)
//   parsedStr = utils.replaceBasicHTML(parsedStr, 'b');
//   parsedStr = utils.replaceBasicHTML(parsedStr, 'i');
//   parsedStr = utils.replaceBasicHTML(parsedStr, 's');
//   // parsedStr = utils.replaceBoldHTML(parsedStr);

//   return parsedStr;
// };

const OPENING_CHAR = '<';
const CLOSING_CHAR = '>';
const CLOSING_HTML_CHARS = '</';

const CHARS_ESCAPE_MAP = {
  '<': '&lt;',
  '>': '&gt;',
  '&': '&amp;',
};

const HTML_TAG_MAP = {
  strong: '*',
  b: '*',
  em: '_',
  i: '_',
  strike: '~',
  br: '/n',
  p: '/n',
  ul: {
    isWrapper: true,
    innerTag: {
      tag: 'li',
      value: {
        open: '- ',
        close: ''
      }
    },
  },
  ol: {
    isWrapper: true,
    innerTag: {
      tag: 'li',
      value: {
        open: '1. ',
        close: '',
      },
    },
  },
};

const SORTED_HTML_TAG_VALUES = Object.keys(HTML_TAG_MAP).sort((a, b) => a.length - b.length);

const ALLOWED_TAG_CHARACTERS = {'a': true, 'b': true, 'c': true, 'd': true, 'e': true, 'f': true, 'g': true, 'h': true, 'i': true, 'j': true, 'k': true, 'l': true, 'm': true, 'n': true, 'o': true, 'p': true, 'q': true, 'r': true, 's': true, 't': true, 'u': true, 'v': true, 'w': true, 'x': true, 'y': true, 'z': true};

const isOpeningChar = str => str === OPENING_CHAR;
const findClosingChar = arr => arr.findIndex(e => e === CLOSING_CHAR);
const formatTagContent = splitStr => {
  // remove non-alpha characters
  const alphaOnlyChars = splitStr.filter(char => ALLOWED_TAG_CHARACTERS[char]);
  // create trimmed string
  const trimmedStr = alphaOnlyChars.join('').trim();
  return trimmedStr;
};
const isKnownHTMLTag = str => SORTED_HTML_TAG_VALUES.includes(str);
const isClosingHTMLTag = str => str.slice(0, 2) === CLOSING_HTML_CHARS;
const isInnerTag = (curStr, innerTag) => curStr === innerTag;

const parseData = async str => {
  let parsedStr = '';

  const recurseThru = (splitStr, parents = []) => {
    console.log('');
    console.log('');
    console.log('====');
    // if we have no length, return
    if (!splitStr || !splitStr.length) {
      console.log('DONE');
      return;
    }
    // setup parent to use, if available
    const parent = parents.length ? parents[parents.length - 1] : null;
    // grab current character
    const curChar = splitStr[0];
    // check if current char is an opening tag
    if (isOpeningChar(curChar)) {
      // THEN: check if it is a known tag
      // find closing tag index
      const nearestClosingTagIdx = findClosingChar(splitStr);
      // grab the whole tag
      const htmlTagSplit = splitStr.slice(0, nearestClosingTagIdx + 1);
      const htmlTag = htmlTagSplit.join('');
      console.log('CHECKING htmlTag: ', htmlTag);
      // create slice from 1 -> closing tag idx
      const tagContent = formatTagContent(htmlTagSplit);
      console.log('tagContent: ', tagContent);
      console.log('parents: ', parents);
      console.log('parent: ', parent);
      const isMainTag = isKnownHTMLTag(tagContent);
      
      // check if this is a parent closing tag so we just move on
      if (isMainTag && parent && isClosingHTMLTag(htmlTag) && parent.tag === tagContent) {
        console.log('IS CLOSING PARENT TAG');
        return recurseThru(splitStr.slice(nearestClosingTagIdx + 1), parents.slice(0, parents.length -1));
      }

      // check if this is an inner tag of the current parent
      if (parent && isInnerTag(tagContent, parent.innerTag.tag)) {
        console.log('IS INNER TAG');
        // check if replacement is simply a string
        if (typeof parent.innerTag.value === 'string') {
          // THEN: add string replacement to parsed string
          parsedStr += parent.innerTag.value;
        }
        // ELSE: add either open or close str to output
        else if (isClosingHTMLTag(htmlTag)) {
          parsedStr += parent.innerTag.value.close;
        }
        else {
          parsedStr += parent.innerTag.value.open;
        }
        // FINALLY: move to next char after tag close
        return recurseThru(splitStr.slice(nearestClosingTagIdx + 1), parents);
      }

      // check if string is a regular known main html tag
      if (isMainTag) {
        // handle replacement or parenthood
        const slackReplacement = HTML_TAG_MAP[tagContent];
        
        // check if it's a wrapper
        if (slackReplacement.isWrapper) {
          // THEN: handle data verification

          console.log('IS WRAPPER TAG');

          // TODO: fix this to not fail on empty str
          // if (!slackReplacement.innerTag 
          //   || !slackReplacement.innerTag.tag 
          //   || !slackReplacement.innerTag.value 
          //   || (
          //     typeof slackReplacement.innerTag.value === 'object' 
          //     && (
          //       !slackReplacement.innerTag.value.open 
          //       || !slackReplacement.innerTag.value.close
          //     )
          //   )
          // ) {
          //   console.log(`WARNING: skipped replacement of ${htmlTag} - missing required innerTag data`);
          // }

          // format newParent data
          const newParent = {
            tag: tagContent,
            ...slackReplacement
          };
          // continue but include new parent item
          return recurseThru(splitStr.slice(nearestClosingTagIdx + 1), [...parents, newParent]);
        }

        console.log('IS GENERAL TAG');

        // check if slack replacement is simply a string
        if (typeof slackReplacement === 'string') {
          // THEN: add string replacement to parsed string
          parsedStr += slackReplacement;
        }
        else {
          // if we've made it here handle open / close specific tag
          const { open, close } = slackReplacement;
          // handle error
          if (!open || !close) {
            console.log(`WARNING: skipped replacement of ${htmlTag} - missing required open/close data`);
            return recurseThru(splitStr.slice(1), parents);
          }
          // add either open or close str to output
          if (isClosingHTMLTag(htmlTag)) {
            parsedStr += close;
          }
          else {
            parsedStr += open;
          }
        }

        // FINALLY: if we've madeit here, recursively call starting at nearestClosingTag + 1
        return recurseThru(splitStr.slice(nearestClosingTagIdx + 1), parents);
      }
    }

    // check if char should be escaped
    if (CHARS_ESCAPE_MAP[curChar]) {
      console.log('IS ESCAPE CHAR');
      parsedStr += CHARS_ESCAPE_MAP[curChar];
    }

    // ELSE: just push the exact char
    else {
      console.log('IS REGULAR CHAR');
      parsedStr += curChar;
    }

    // FINALLY: recursively call starting at + 1
    return recurseThru(splitStr.slice(1), parents);
  };

  recurseThru(str.split(''));

  console.log('parsedStr: ', parsedStr);
  return parsedStr;
};

const parseHTMLData = async () => {
  const html = await getHTML();
  return parseData(html);
};

parseHTMLData()
  .then(parsedData => writePromise('./output/output.txt', parsedData, 'utf-8'))
  .then(() => console.log('Wrote output to file'), () => console.log('Could not output to file'));