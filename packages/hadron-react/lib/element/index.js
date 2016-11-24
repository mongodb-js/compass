const Value = require('./value');
const BinaryValue = require('./binary');
const CodeValue = require('./code');
const DateValue = require('./date');
const DoubleValue = require('./double');
const Int32Value = require('./int32');
const KeyValue = require('./key');

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
  'ObjectId': Value
};

/**
 * Get a component for the provided BSON type.
 *
 * @returns {React.Component} The react component.
 */
const getComponent = type => {
  return MAPPINGS[type] || Value;
};

module.exports = getComponent;
module.exports.Value = Value;
module.exports.BinaryValue = BinaryValue;
module.exports.CodeValue = CodeValue;
module.exports.DateValue = DateValue;
module.exports.DoubleValue = DoubleValue;
module.exports.Int32Value = Int32Value;
module.exports.KeyValue = KeyValue;