const constants = require('./constants');

/**
 * HTML UTILS
 */

const getBasicContantValues = (category) => {
  switch(category) {
    case 'b':
      return [constants.BOLD.slack, constants.BOLD.html];
    case 'i':
      return [constants.ITALIC.slack, constants.ITALIC.html];
    case 's':
      return [constants.STRIKETHROUGH.slack, constants.STRIKETHROUGH.html];
    default:
      return ['', []];
  }
};

const replaceBasicHTML = (text, category) => {
  let updatedText = text;
  const [ slackReplacement, htmlTags ] = getBasicContantValues(category);
  htmlTags.forEach((tag) => {
    const startTag = new RegExp(`<${tag}>`, 'gi');
    const endTag = new RegExp(`</${tag}>`, 'gi');
    // replace start
    updatedText = updatedText.replace(startTag, slackReplacement);
    // replace end
    updatedText = updatedText.replace(endTag, slackReplacement);
  });
  return updatedText;
};

module.exports = {
  replaceBasicHTML,
}