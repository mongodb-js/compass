'use strict';

var Value = require('./value');
var BinaryValue = require('./binary-value');
var CodeValue = require('./code-value');
var DateValue = require('./date-value');
var DoubleValue = require('./double-value');
var Int32Value = require('./int32-value');
var KeyValue = require('./key-value');
var RegexValue = require('./regex-value');
var DBRefValue = require('./dbref-value');
var StringValue = require('./string-value');

/**
 * The mappings from the BSON type to the value component
 * that renders it.
 */
var MAPPINGS = {
  'Binary': BinaryValue,
  'Code': CodeValue,
  'Date': DateValue,
  'Decimal128': Value,
  'Double': DoubleValue,
  'Int32': Int32Value,
  'Int64': Value,
  'MaxKey': KeyValue,
  'MinKey': KeyValue,
  'String': StringValue,
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
var getComponent = function getComponent(type) {
  return MAPPINGS[type] || Value;
};

module.exports = getComponent;