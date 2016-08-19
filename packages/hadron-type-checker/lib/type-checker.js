'use strict';

const isPlainObject = require('lodash.isplainobject');
const isArray = require('lodash.isarray');
const isString = require('lodash.isstring');
const isNumber = require('lodash.isnumber');
const has = require('lodash.has');
const find = require('lodash.find');
const toNumber = require('lodash.tonumber');
const toString = require('lodash.tostring');
const bson = require('bson');
const MinKey = bson.MinKey;
const MaxKey = bson.MaxKey;
const Long = bson.Long;
const Double = bson.Double;

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
 * The max long value.
 */
const JS_INT_MAX_LONG = Long.fromNumber(0x20000000000000);

/**
 * The min long value.
 */
const JS_INT_MIN_LONG = Long.fromNumber(-0x20000000000000);

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

function toLong(object) {
  return new Long(toNumber(object));
}

function toDouble(object) {
  return new Double(toNumber(object));
}

/**
 * The functions to cast to a type.
 */
const CASTERS = {
  'Int32': toNumber,
  'Int64': toLong,
  'Double': toDouble,
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

/**
 * Checks if a string is an int32.
 */
class Int32Check {
  test(string) {
    if (/^-?\d+$/.test(string)) {
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
    if (/^-?\d+$/.test(string)) {
      var value = toNumber(string);
      return value >= JS_INT_MIN_LONG && value <= JS_INT_MAX_LONG;
    }
    return false;
  }
}

/**
 * Checks if a string is a date.
 */
class DateCheck {
  test(string) {
    var date = Date.parse(string);
    return date ? true : false;
  }
}

const INT32_CHECK = new Int32Check();
const INT64_CHECK = new Int64Check();
const DATE_CHECK = new DateCheck();

/**
 * The various string tests.
 */
const STRING_TESTS = [
  new Test(/^$/, [ 'String', 'Null', 'Undefined', 'MinKey', 'MaxKey', 'Object', 'Array' ]),
  new Test(INT32_CHECK, [ 'Int32', 'Int64', 'Double', 'String', 'Object', 'Array' ]),
  new Test(INT64_CHECK, [ 'Int64', 'Double', 'String', 'Object', 'Array' ]),
  new Test(/^-?(\d*\.)?\d+$/, [ 'Double', 'String', 'Object', 'Array' ]),
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
  castableTypes(object) {
    if (isString(object)) {
      return this._stringTypes(object);
    }
    return [ this.type(object), 'String', 'Object', 'Array' ];
  }

  _stringTypes(string) {
    var passing = find(STRING_TESTS, (test) => {
      return test.tester.test(string);
    });
    return passing ? passing.types : [ 'String', 'Object', 'Array' ];
  }
}

module.exports = new TypeChecker();
