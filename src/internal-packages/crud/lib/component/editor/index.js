const StandardEditor = require('./standard');
const DateEditor = require('./date');

const init = (element) => {
  return {
    'Standard': new StandardEditor(element),
    'Date': new DateEditor(element)
  }
};

module.exports = init;
module.exports.DateEditor = DateEditor;
module.exports.StandardEditor = StandardEditor;
