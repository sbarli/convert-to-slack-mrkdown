const lineBreak = {
  slack: "\n",
  html: [{
    characters: 'br',
    selfClosing: true
  }]
};

const unorderedListItem = {
  slack: "- ",
  html: ['li']
}

const orderedListItem = {
  slack: "1. ",
  html: ['li']
}

module.exports = {
  BOLD: {
    slack: "*",
    html: ['b', 'strong']
  },
  ITALIC: {
    slack: "_",
    html: ['em', 'i']
  },
  STRIKETHROUGH: {
    slack: "~",
    html: ['strike']
  },
};