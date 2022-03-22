const StandardEditor = require('./standard');
const StringEditor = require('./string');
const Decimal128Editor = require('./decimal128');
const Int32Editor = require('./int32');
const Int64Editor = require('./int64');
const DoubleEditor = require('./double');
const DateEditor = require('./date');
const NullEditor = require('./null');
const UndefinedEditor = require('./undefined');
const ObjectIdEditor = require('./objectid');

const init = (element) => {
  return {
    Standard: new StandardEditor(element),
    String: new StringEditor(element),
    Decimal128: new Decimal128Editor(element),
    Date: new DateEditor(element),
    Double: new DoubleEditor(element),
    Int32: new Int32Editor(element),
    Int64: new Int64Editor(element),
    Null: new NullEditor(element),
    Undefined: new UndefinedEditor(element),
    ObjectId: new ObjectIdEditor(element)
  };
};

Object.assign(init, {
  DateEditor,
  StandardEditor,
  StringEditor,
  Decimal128Editor,
  DoubleEditor,
  Int32Editor,
  Int64Editor,
  NullEditor,
  UndefinedEditor,
  ObjectIdEditor
});

module.exports = init;
