import Value from './value';
import BinaryValue from './binary-value';
import CodeValue from './code-value';
import DateValue from './date-value';
import DoubleValue from './double-value';
import Int32Value from './int32-value';
import KeyValue from './key-value';
import RegexValue from './regex-value';
import DBRefValue from './dbref-value';
import StringValue from './string-value';

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
const getComponent = (type) => {
  return MAPPINGS[type] || Value;
};

export default getComponent;
export {
  Value,
  BinaryValue,
  CodeValue,
  DateValue,
  DoubleValue,
  Int32Value,
  KeyValue,
  RegexValue,
  DBRefValue,
  StringValue
};
