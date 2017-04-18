'use strict';

const isPlainObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isString = require('lodash.isstring');
const isNumber = require('lodash.isnumber');
const has = require('lodash.has');
const keys = require('lodash.keys');
const without = require('lodash.without');
const toNumber = require('lodash.tonumber');
const toString = require('lodash.tostring');
const includes = require('lodash.includes');
const bson = require('bson');
const MinKey = bson.MinKey;
const MaxKey = bson.MaxKey;
const Long = bson.Long;
const Double = bson.Double;
const Int32 = bson.Int32;
const Decimal128 = bson.Decimal128;

/**
 * The object string.
 */
const OBJECT = 'Object';

/**
 * The array type string.
 */
const ARRAY = 'Array';

/**
 * True constant.
 */
const TRUE = 'true';

/**
 * Long constant.
 */
const LONG = 'Long';

const INT_32 = 'Int32';
const INT_64 = 'Int64';
const DOUBLE = 'Double';
const DECIMAL_128 = 'Decimal128';
const OBJECT_TYPE = '[object Object]';
const EMPTY = '';

/**
 * The bson type field.
 */
const BSON_TYPE = '_bsontype';

/**
 * The match regex.
 */
const MATCH = /\[object (\w+)\]/;

/**
 * The max int 32 value.
 */
const BSON_INT32_MAX = 0x7FFFFFFF;

/**
 * The min int 32 value.
 */
const BSON_INT32_MIN = -0x80000000;

/**
 * The number regex.
 */
const NUMBER_REGEX = /^-?\d+$/;

/**
 * All bson types that are numbers.
 */
const NUMBER_TYPES = [
  'Long',
  'Int32',
  'Double',
  'Decimal128'
];

const toDate = (object) => {
  return new Date(object);
};

const toMinKey = () => {
  return new MinKey();
};

const toMaxKey = () => {
  return new MaxKey();
};

const toUndefined = () => {
  return undefined;
};

const toNull = () => {
  return null;
};

const toBoolean = (object) => {
  if (isString(object)) {
    if (object.toLowerCase() === TRUE) {
      return true;
    }
    return false;
  }
  if (object) {
    return true;
  }
  return false;
};

const toObject = (object) => {
  if (isPlainObject(object)) {
    return object;
  }
  return {};
};

const toArray = (object) => {
  if (isArray(object)) {
    return object;
  }
  if (isPlainObject(object)) {
    return [];
  }
  return [ object ];
};

const toInt32 = (object) => {
  return new Int32(toNumber(object));
};

const toInt64 = (object) => {
  return Long.fromNumber(toNumber(object));
};

const toDouble = (object) => {
  return new Double(toNumber(object));
};

const toDecimal128 = (object) => {
  /*
   If converting a BSON Object, extract the value before converting to a string.
   */
  if (has(object, BSON_TYPE) && includes(NUMBER_TYPES, object._bsontype)) {
    object = object._bsontype === LONG ? object.toNumber() : object.valueOf();
  }
  return Decimal128.fromString(String(object));
};

const toObjectID = (object) => {
  if (object === '') {
    return new bson.ObjectID();
  }
  return bson.ObjectID.createFromHexString(object);
};

const toBinary = () => {

};

const toDocument = () => {

};

const toRegex = () => {

};

const toCode = () => {

};

const toCodeWithScope = () => {

};

const toSymbol = () => {

};

const toTimestamp = () => {

};

/**
 * The functions to cast to a type.
 */
const CASTERS = {
  'Array': toArray,
  'Binary': toBinary,
  'Boolean': toBoolean,
  'Code': toCode,
  'CodeWithScope': toCodeWithScope,
  'Date': toDate,
  'Decimal128': toDecimal128,
  'Document': toDocument,
  'Double': toDouble,
  'Int32': toInt32,
  'Int64': toInt64,
  'MaxKey': toMaxKey,
  'MinKey': toMinKey,
  'Null': toNull,
  'Object': toObject,
  'ObjectID': toObjectID,
  'Regex': toRegex,
  'String': toString,
  'Symbol': toSymbol,
  'Timestamp': toTimestamp,
  'Undefined': toUndefined
};

/**
 * An array of all bson types.
 */
const TYPES = keys(CASTERS);

/**
 * Checks if a string is an int32.
 */
class Int32Check {
  test(string) {
    if (NUMBER_REGEX.test(string)) {
      var value = toNumber(string);
      return value >= BSON_INT32_MIN && value <= BSON_INT32_MAX;
    }
    return false;
  }
}

/**
 * Checks if a string is an int64.
 */
class Int64Check {
  test(string) {
    if (NUMBER_REGEX.test(string)) {
      return Number.isSafeInteger(toNumber(string));
    }
    return false;
  }
}

const INT32_CHECK = new Int32Check();
const INT64_CHECK = new Int64Check();

/**
 * Gets the BSON type for a JS number.
 *
 * @param {Number} number - The number.
 *
 * @returns {String} The BSON type.
 */
const numberToBsonType = (number) => {
  var string = toString(number);
  if (INT32_CHECK.test(string)) {
    return INT_32;
  } else if (INT64_CHECK.test(string)) {
    return INT_64;
  }
  return DOUBLE;
};

/**
 * Checks the types of objects and returns them as readable strings.
 */
class TypeChecker {

  /**
   * Cast the provided object to the desired type.
   *
   * @param {Object} object - The object to cast.
   * @param {String} type - The type.
   *
   * @returns {Object} The cast object.
   */
  cast(object, type) {
    var caster = CASTERS[type];
    var result = object;
    if (caster) {
      result = caster(object);
    }
    return result === OBJECT_TYPE ? EMPTY : result;
  }

  /**
   * Get the type for the object.
   *
   * @param {Object} object - The object.
   *
   * @returns {String} The object type.
   */
  type(object) {
    if (isNumber(object)) {
      return numberToBsonType(object);
    }
    if (isPlainObject(object)) {
      return OBJECT;
    }
    if (isArray(object)) {
      return ARRAY;
    }
    if (has(object, BSON_TYPE)) {
      if (object._bsontype === LONG) {
        return INT_64;
      }
      return object._bsontype;
    }
    return Object.prototype.toString.call(object).replace(MATCH, '$1');
  }

  /**
   * Get a list of types the object can be cast to.
   *
   * @param {Boolean} highPrecisionSupport - If Decimal128 is supported or not.
   *
   * @returns {Array} The available types.
   */
  castableTypes(highPrecisionSupport = false) {
    if (highPrecisionSupport === true) {
      return TYPES;
    }
    return without(TYPES, DECIMAL_128);
  }
}

module.exports = new TypeChecker();
