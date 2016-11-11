'use strict';

const isPlainObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isString = require('lodash.isstring');
const isNumber = require('lodash.isnumber');
const has = require('lodash.has');
const find = require('lodash.find');
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
 * The max double value.
 */
const MAX_DBL = Number.MAX_SAFE_INTEGER;

/**
 * All bson types that are numbers.
 */
const NUMBER_TYPES = [
  'Long',
  'Int32',
  'Double',
  'Decimal128'
];

function toDate(object) {
  return new Date(object);
}

function toMinKey() {
  return new MinKey();
}

function toMaxKey() {
  return new MaxKey();
}

function toUndefined() {
  return undefined;
}

function toNull() {
  return null;
}

function toBoolean(object) {
  if (object.toLowerCase() === 'true') {
    return true;
  }
  return false;
}

function toObject(object) {
  if (isPlainObject(object)) {
    return object;
  }
  return {};
}

function toArray(object) {
  if (isArray(object)) {
    return object;
  }
  return [ object ];
}

function toInt32(object) {
  return new Int32(toNumber(object));
}

function toInt64(object) {
  return Long.fromNumber(toNumber(object));
}

function toDouble(object) {
  return new Double(toNumber(object));
}

function toDecimal128(object) {
  return Decimal128.fromString(String(object));
}

/**
 * The functions to cast to a type.
 */
const CASTERS = {
  'Int32': toInt32,
  'Int64': toInt64,
  'Double': toDouble,
  'Decimal128': toDecimal128,
  'Date': toDate,
  'MinKey': toMinKey,
  'MaxKey': toMaxKey,
  'Undefined': toUndefined,
  'Null': toNull,
  'Boolean': toBoolean,
  'String': toString,
  'Object': toObject,
  'Array': toArray
};

/**
 * A test that returns the types is passing.
 */
class Test {
  constructor(tester, types) {
    this.tester = tester;
    this.types = types;
  }
}

const NUMBER_REGEX = /^-?\d+$/;

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

/**
 * Checks if integer can be cast to double.
 */
class IntDblCheck {
  test(string) {
    if (NUMBER_REGEX.test(string)) {
      var value = toNumber(string);
      return value >= -MAX_DBL && value <= MAX_DBL;
    }
    return false;
  }
}

const DOUBLE_REGEX = /^-?(\d*\.)?\d{1,15}$/;

/**
 * Checks if the value can be cast to a double.
 */
class DoubleCheck {
  test(string) {
    if (DOUBLE_REGEX.test(string)) {
      var value = toNumber(string);
      return value >= -MAX_DBL && value <= MAX_DBL;
    }
    return false;
  }
}

var PARSE_STRING_REGEXP = /^(?=\d)(\+|\-)?(\d+|(\d*\.\d*))?(E|e)?([\-\+])?(\d+)?$/;
var PARSE_INF_REGEXP = /^(\+|\-)?(Infinity|inf)$/i;
var PARSE_NAN_REGEXP = /^(\+|\-)?NaN$/i;

/**
 * Checks if the value can be cast to a decimal 128.
 */
class Decimal128Check {
  test(string) {
    const stringMatch = string.match(PARSE_STRING_REGEXP);
    const infMatch = string.match(PARSE_INF_REGEXP);
    const nanMatch = string.match(PARSE_NAN_REGEXP);

    const regex = stringMatch || infMatch || nanMatch;
    const exp = stringMatch && stringMatch[4] && stringMatch[2] === undefined;

    return string.length !== 0 && regex && !exp;
  }
}

const DATE_REGEX = /^(\d{4})-(\d|\d{2})-(\d|\d{2})(T\d{2}\:\d{2}\:\d{2}(\.\d+)?)?$/;

/**
 * Checks if a string is a date.
 */
class DateCheck {
  test(string) {
    if (DATE_REGEX.test(string)) {
      var date = Date.parse(string);
      return date ? true : false;
    }
  }
}

const INT32_CHECK = new Int32Check();
const INT64_CHECK = new Int64Check();
const INT_DBL_CHECK = new IntDblCheck();
const DOUBLE_CHECK = new DoubleCheck();
const DECIMAL_128_CHECK = new Decimal128Check();
const DATE_CHECK = new DateCheck();

/**
 * The various string tests.
 */
const STRING_TESTS = [
  new Test(/^$/, [ 'String', 'Null', 'Undefined', 'MinKey', 'MaxKey', 'Object', 'Array' ]),
  new Test(INT32_CHECK, [ 'Int32', 'Int64', 'Double', 'String', 'Object', 'Array' ]),
  new Test(INT_DBL_CHECK, [ 'Int64', 'Double', 'String', 'Object', 'Array' ]),
  new Test(INT64_CHECK, [ 'Int64', 'String', 'Object', 'Array' ]),
  new Test(DOUBLE_CHECK, [ 'Double', 'String', 'Object', 'Array' ]),
  new Test(/^(null)$/, [ 'Null', 'String', 'Object', 'Array' ]),
  new Test(/^(undefined)$/, [ 'Undefined', 'String', 'Object', 'Array' ]),
  new Test(/^(true|false)$/, [ 'Boolean', 'String', 'Object', 'Array' ]),
  new Test(/^\/(.*)\/$/, [ 'BSONRegExp', 'String', 'Object', 'Array' ]),
  new Test(DATE_CHECK, [ 'Date', 'String', 'Object', 'Array' ])
];

/**
 * String tests with high precision support.
 */
const HP_STRING_TESTS = [
  new Test(/^$/, [ 'String', 'Null', 'Undefined', 'MinKey', 'MaxKey', 'Object', 'Array' ]),
  new Test(INT32_CHECK, [ 'Int32', 'Int64', 'Double', 'Decimal128', 'String', 'Object', 'Array' ]),
  new Test(INT_DBL_CHECK, [ 'Int64', 'Double', 'Decimal128', 'String', 'Object', 'Array' ]),
  new Test(INT64_CHECK, [ 'Int64', 'Decimal128', 'String', 'Object', 'Array' ]),
  new Test(DOUBLE_CHECK, [ 'Double', 'Decimal128', 'String', 'Object', 'Array' ]),
  new Test(DECIMAL_128_CHECK, [ 'Decimal128', 'String', 'Object', 'Array' ]),
  new Test(/^(null)$/, [ 'Null', 'String', 'Object', 'Array' ]),
  new Test(/^(undefined)$/, [ 'Undefined', 'String', 'Object', 'Array' ]),
  new Test(/^(true|false)$/, [ 'Boolean', 'String', 'Object', 'Array' ]),
  new Test(/^\/(.*)\/$/, [ 'BSONRegExp', 'String', 'Object', 'Array' ]),
  new Test(DATE_CHECK, [ 'Date', 'String', 'Object', 'Array' ])
];

/**
 * Gets the BSON type for a JS number.
 *
 * @param {Number} number - The number.
 *
 * @returns {String} The BSON type.
 */
function numberToBsonType(number) {
  var string = toString(number);
  if (INT32_CHECK.test(string)) {
    return 'Int32';
  } else if (INT64_CHECK.test(string)) {
    return 'Int64';
  }
  return 'Double';
}

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
    return result === '[object Object]' ? '' : result;
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
      if (object._bsontype === 'Long') {
        return 'Int64';
      }
      return object._bsontype;
    }
    return Object.prototype.toString.call(object).replace(MATCH, '$1');
  }

  /**
   * Get a list of types the object can be cast to.
   *
   * @param {Object} - The object.
   *
   * @returns {Array} The available types.
   */
  castableTypes(object, highPrecisionSupport = false) {
    if (isString(object)) {
      return this._stringTypes(object, highPrecisionSupport);
    } else if (isNumber(object)) {
      return this._stringTypes(String(object), highPrecisionSupport);
    } else if (has(object, BSON_TYPE) && this._isNumberType(object._bsontype)) {
      var rawValue = object._bsontype === 'Long' ? object.toNumber() : object.valueOf();
      return this._stringTypes(String(rawValue), highPrecisionSupport);
    }
    return [ this.type(object), 'String', 'Object', 'Array' ];
  }

  _isNumberType(bsontype) {
    return includes(NUMBER_TYPES, bsontype);
  }

  _stringTypes(string, highPrecisionSupport) {
    var passing = find(highPrecisionSupport ? HP_STRING_TESTS : STRING_TESTS, (test) => {
      return test.tester.test(string);
    });
    return passing ? passing.types : [ 'String', 'Object', 'Array' ];
  }
}

module.exports = new TypeChecker();
