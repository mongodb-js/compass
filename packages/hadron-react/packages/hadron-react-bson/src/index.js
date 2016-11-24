const Value = require('./value');
const BinaryValue = require('./binary-value');
const CodeValue = require('./code-value');
const DateValue = require('./date-value');
const DoubleValue = require('./double-value');
const Int32Value = require('./int32-value');
const KeyValue = require('./key-value');
const RegexValue = require('./regex-value');
const DBRefValue = require('./dbref-value');

/**
 * The mappings from the BSON type to the value component
 * that renders it.
 */
const MAPPINGS = {
  'Binary': BinaryValue,
  'Code': CodeValue,
  'Date': DateValue,
  'Decimal128': Value,
  'Double': DoubleValue,
  'Int32': Int32Value,
  'Int64': Value,
  'MaxKey': KeyValue,
  'MinKey': KeyValue,
  'String': Value,
  'ObjectId': Value,
  'BSONRegExp': RegexValue,
  'Symbol': Value,
  'Timestamp': Value,
  'Undefined': Value,
  'Null': Value,
  'Boolean': Value,
  'DBRef': DBRefValue
};

/**
 * Get a component for the provided BSON type.
 *
 * @returns {React.Component} The react component.
 */
const getComponent = (type) => {
  return MAPPINGS[type] || Value;
};

module.exports = getComponent;
