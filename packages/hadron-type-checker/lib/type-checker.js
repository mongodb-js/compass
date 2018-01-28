'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var isPlainObject = require('lodash.isplainobject');
var isArray = require('lodash.isarray');
var isString = require('lodash.isstring');
var isNumber = require('lodash.isnumber');
var has = require('lodash.has');
var keys = require('lodash.keys');
var without = require('lodash.without');
var toNumber = require('lodash.tonumber');
var toString = require('lodash.tostring');
var includes = require('lodash.includes');
var bson = require('bson');
var MinKey = bson.MinKey;
var MaxKey = bson.MaxKey;
var Long = bson.Long;
var Double = bson.Double;
var Int32 = bson.Int32;
var Decimal128 = bson.Decimal128;
var Binary = bson.Binary;
var BSONRegExp = bson.BSONRegExp;
var Code = bson.Code;
var _Symbol = bson.Symbol;
var Timestamp = bson.Timestamp;

/**
 * The object string.
 */
var OBJECT = 'Object';

/**
 * The array type string.
 */
var ARRAY = 'Array';

/**
 * True constant.
 */
var TRUE = 'true';

/**
 * False constant.
 */
var FALSE = 'false';

/**
 * Long constant.
 */
var LONG = 'Long';

var INT_32 = 'Int32';
var INT_64 = 'Int64';
var DOUBLE = 'Double';
var DECIMAL_128 = 'Decimal128';
var OBJECT_TYPE = '[object Object]';
var EMPTY = '';
var OBJECT_ID = 'ObjectID';

/**
 * The bson type field.
 */
var BSON_TYPE = '_bsontype';

/**
 * The match regex.
 */
var MATCH = /\[object (\w+)\]/;

/**
 * The max int 32 value.
 */
var BSON_INT32_MAX = 0x7FFFFFFF;

/**
 * The min int 32 value.
 */
var BSON_INT32_MIN = -0x80000000;

var BSON_INT64_MAX = Math.pow(2, 63) - 1;
var BSON_INT64_MIN = -BSON_INT64_MAX;

/**
 * The number regex.
 */
var NUMBER_REGEX = /^-?\d+$/;

/**
 * All bson types that are numbers.
 */
var NUMBER_TYPES = ['Long', 'Int32', 'Double', 'Decimal128'];

var toDate = function toDate(object) {
  return new Date(object);
};

var toMinKey = function toMinKey() {
  return new MinKey();
};

var toMaxKey = function toMaxKey() {
  return new MaxKey();
};

var toUndefined = function toUndefined() {
  return undefined;
};

var toNull = function toNull() {
  return null;
};

var toBoolean = function toBoolean(object) {
  if (isString(object)) {
    if (object.toLowerCase() === TRUE) {
      return true;
    } else if (object.toLowerCase() === FALSE) {
      return false;
    }
    throw new Error('\'' + object + '\' is not a valid boolean string');
  }
  if (object) {
    return true;
  }
  return false;
};

var toObject = function toObject(object) {
  if (isPlainObject(object)) {
    return object;
  }
  return {};
};

var toArray = function toArray(object) {
  if (isArray(object)) {
    return object;
  }
  if (isPlainObject(object)) {
    return [];
  }
  return [object];
};

var toInt32 = function toInt32(object) {
  if (object === '-' || object === '') {
    throw new Error('Value \'' + object + '\' is not a valid Int32 value');
  }
  var number = toNumber(object);
  if (number >= BSON_INT32_MIN && number <= BSON_INT32_MAX) {
    return new Int32(number);
  }
  throw new Error('Value ' + number + ' is outside the valid Int32 range');
};

var toInt64 = function toInt64(object) {
  if (object === '-' || object === '') {
    throw new Error('Value \'' + object + '\' is not a valid Int64 value');
  }
  var number = toNumber(object);
  if (number >= BSON_INT64_MIN && number <= BSON_INT64_MAX) {
    return Long.fromNumber(number);
  }
  throw new Error('Value ' + number + ' is outside the valid Int64 range');
};

var toDouble = function toDouble(object) {
  if (object === '-' || object === '') {
    throw new Error('Value \'' + object + '\' is not a valid Double value');
  }
  if (isString(object) && object.endsWith('.')) {
    throw new Error('Please enter at least one digit after the decimal');
  }
  var number = toNumber(object);
  return new Double(number);
};

var toDecimal128 = function toDecimal128(object) {
  /*
   If converting a BSON Object, extract the value before converting to a string.
   */
  if (has(object, BSON_TYPE) && includes(NUMBER_TYPES, object._bsontype)) {
    object = object._bsontype === LONG ? object.toNumber() : object.valueOf();
  }
  return Decimal128.fromString(String(object));
};

var toObjectID = function toObjectID(object) {
  if (!isString(object) || object === '') {
    return new bson.ObjectID();
  }
  return bson.ObjectID.createFromHexString(object);
};

var toBinary = function toBinary(object) {
  return new Binary(String(object), Binary.SUBTYPE_DEFAULT);
};

var toRegex = function toRegex(object) {
  return new BSONRegExp(String(object));
};

var toCode = function toCode(object) {
  return new Code(String(object), {});
};

var toSymbol = function toSymbol(object) {
  return new _Symbol(String(object));
};

var toTimestamp = function toTimestamp(object) {
  var number = toNumber(object);
  return Timestamp.fromNumber(number);
};

/**
 * The functions to cast to a type.
 */
var CASTERS = {
  'Array': toArray,
  'Binary': toBinary,
  'Boolean': toBoolean,
  'Code': toCode,
  'Date': toDate,
  'Decimal128': toDecimal128,
  'Double': toDouble,
  'Int32': toInt32,
  'Int64': toInt64,
  'MaxKey': toMaxKey,
  'MinKey': toMinKey,
  'Null': toNull,
  'Object': toObject,
  'ObjectId': toObjectID,
  'BSONRegexp': toRegex,
  'String': toString,
  'Symbol': toSymbol,
  'Timestamp': toTimestamp,
  'Undefined': toUndefined
};

/**
 * An array of all bson types.
 */
var TYPES = keys(CASTERS);

/**
 * Checks if a string is an int32.
 */

var Int32Check = function () {
  function Int32Check() {
    _classCallCheck(this, Int32Check);
  }

  _createClass(Int32Check, [{
    key: 'test',
    value: function test(string) {
      if (NUMBER_REGEX.test(string)) {
        var value = toNumber(string);
        return value >= BSON_INT32_MIN && value <= BSON_INT32_MAX;
      }
      return false;
    }
  }]);

  return Int32Check;
}();

/**
 * Checks if a string is an int64.
 */


var Int64Check = function () {
  function Int64Check() {
    _classCallCheck(this, Int64Check);
  }

  _createClass(Int64Check, [{
    key: 'test',
    value: function test(string) {
      if (NUMBER_REGEX.test(string)) {
        return Number.isSafeInteger(toNumber(string));
      }
      return false;
    }
  }]);

  return Int64Check;
}();

var INT32_CHECK = new Int32Check();
var INT64_CHECK = new Int64Check();

/**
 * Gets the BSON type for a JS number.
 *
 * @param {Number} number - The number.
 *
 * @returns {String} The BSON type.
 */
var numberToBsonType = function numberToBsonType(number) {
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

var TypeChecker = function () {
  function TypeChecker() {
    _classCallCheck(this, TypeChecker);
  }

  _createClass(TypeChecker, [{
    key: 'cast',


    /**
     * Cast the provided object to the desired type.
     *
     * @param {Object} object - The object to cast.
     * @param {String} type - The type.
     *
     * @returns {Object} The cast object.
     */
    value: function cast(object, type) {
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

  }, {
    key: 'type',
    value: function type(object) {
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
        if (object._bsontype === OBJECT_ID) {
          return 'ObjectId';
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

  }, {
    key: 'castableTypes',
    value: function castableTypes() {
      var highPrecisionSupport = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;

      if (highPrecisionSupport === true) {
        return TYPES;
      }
      return without(TYPES, DECIMAL_128);
    }
  }]);

  return TypeChecker;
}();

module.exports = new TypeChecker();