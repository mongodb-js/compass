const StandardEditor = require('./standard');
const StringEditor = require('./string');
const Int32Editor = require('./int32');
const DoubleEditor = require('./double');
const DateEditor = require('./date');

const init = (element) => {
  return {
    'Standard': new StandardEditor(element),
    'Date': new DateEditor(element),
    'Double': new DoubleEditor(element),
    'Int32': new Int32Editor(element)
  }
};

module.exports = init;
module.exports.DateEditor = DateEditor;
module.exports.StandardEditor = StandardEditor;
module.exports.StringEditor = StringEditor;
module.exports.DoubleEditor = DoubleEditor;
module.exports.Int32Editor = Int32Editor;
