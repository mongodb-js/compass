const ElementValue = require('./value');
const ElementBinaryValue = require('./binary');
const ElementCodeValue = require('./code');
const ElementDateValue = require('./date');
const ElementDoubleValue = require('./double');
const ElementInt32Value = require('./int32');

/**
 * The mappings from the BSON type to the value component
 * that renders it.
 */
const MAPPINGS = {
  'Binary': ElementBinaryValue,
  'Code': ElementCodeValue,
  'Date': ElementDateValue,
  'Decimal128': ElementValue,
  'Double': ElementDoubleValue,
  'Int32': ElementInt32Value
};

/**
 * Get a component for the provided BSON type.
 *
 * @returns {React.Component} The react component.
 */
const getComponent = (type) => {
  return MAPPINGS[type] || ElementValue;
};

module.exports = getComponent;
module.exports.ElementValue = ElementValue;
module.exports.ElementBinaryValue = ElementBinaryValue;
module.exports.ElementCodeValue = ElementCodeValue;
module.exports.ElementDateValue = ElementDateValue;
module.exports.ElementDoubleValue = ElementDoubleValue;
module.exports.ElementInt32Value = ElementInt32Value;
