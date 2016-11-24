const BsonValue = require('./value');
const BsonBinaryValue = require('./binary');
const BsonCodeValue = require('./code');
const BsonDateValue = require('./date');
const BsonDoubleValue = require('./double');

/**
 * The mappings from the BSON type to the value component
 * that renders it.
 */
const MAPPINGS = {
  'Binary': BsonBinaryValue,
  'Code': BsonCodeValue,
  'Date': BsonDateValue,
  'Decimal128': BsonValue,
  'Double': BsonDoubleValue
};

/**
 * Get a component for the provided BSON type.
 *
 * @returns {React.Component} The react component.
 */
const getComponent = (type) => {
  return MAPPINGS[type] || BsonValue;
};

module.exports = getComponent;
module.exports.BsonValue = BsonValue;
module.exports.BsonBinaryValue = BsonBinaryValue;
module.exports.BsonCodeValue = BsonCodeValue;
module.exports.BsonDateValue = BsonDateValue;
module.exports.BsonDoubleValue = BsonDoubleValue;
