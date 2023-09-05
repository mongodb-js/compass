const {
  isPlainObject,
  isArray,
  isString,
  isNumber,
  hasIn,
  keys,
  without,
  toNumber,
  toString,
} = require('lodash');

const {
  ObjectId,
  MinKey,
  MaxKey,
  Long,
  Double,
  Int32,
  Decimal128,
  Binary,
  BSONRegExp,
  Code,
  BSONSymbol,
  Timestamp,
  Map
} = require('bson');
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
 * False constant.
 */
const FALSE = 'false';

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
const OBJECT_ID = 'ObjectID';
const SYMBOL = 'Symbol';

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
const BSON_INT32_MAX = 0x7fffffff;

/**
 * The min int 32 value.
 */
const BSON_INT32_MIN = -0x80000000;

const BSON_INT64_MAX = Math.pow(2, 63) - 1;
const BSON_INT64_MIN = -BSON_INT64_MAX;

/**
 * The number regex.
 */
const NUMBER_REGEX = /^-?\d+$/;

/**
 * All bson types that are numbers.
 */
const NUMBER_TYPES = ['Long', 'Int32', 'Double', 'Decimal128'];

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
    } else if (object.toLowerCase() === FALSE) {
      return false;
    }
    throw new Error(`'${object}' is not a valid boolean string`);
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
  return [object];
};

const toInt32 = (object) => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Int32 value`);
  }
  const number = toNumber(object);
  if (number >= BSON_INT32_MIN && number <= BSON_INT32_MAX) {
    return new Int32(number);
  }
  throw new Error(`Value ${number} is outside the valid Int32 range`);
};

const toInt64 = (object) => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Int64 value`);
  }

  const number = toNumber(object);

  if (number >= BSON_INT64_MIN && number <= BSON_INT64_MAX) {
    // when casting from int32 object(this will have object.value) or literal
    // (it will a typeof number) we can safely create object fromNumber, as it
    // will not be greater than JS's max value
    if (object.value || typeof object === 'number') {
      return Long.fromNumber(number);
    } else if (typeof object === 'object') {
      // to make sure we are still displaying Very Large numbers properly, convert
      // the current 'object' to a string
      return Long.fromString(object.toString());
    }

    return Long.fromString(object);
  }
  throw new Error(`Value ${object.toString()} is outside the valid Int64 range`);
};

const toDouble = (object) => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Double value`);
  }
  if (isString(object) && object.endsWith('.')) {
    throw new Error('Please enter at least one digit after the decimal');
  }
  const number = toNumber(object);
  return new Double(number);
};

const toDecimal128 = (object) => {
  /*
   If converting a BSON Object, extract the value before converting to a string.
   */
  if (hasIn(object, BSON_TYPE) && NUMBER_TYPES.includes(object._bsontype)) {
    object = object._bsontype === LONG ? object.toString() : object.valueOf();
  }
  return Decimal128.fromString('' + object);
};

const toObjectID = (object) => {
  if (!isString(object) || object === '') {
    return new ObjectId();
  }
  return ObjectId.createFromHexString(object);
};

const toBinary = (object) => {
  const buffer = ArrayBuffer.isView(object) ? Buffer.from(object) : Buffer.from(toString(object), 'utf8');
  return new Binary(buffer, Binary.SUBTYPE_DEFAULT);
};

const toRegex = (object) => {
  return new BSONRegExp('' + object);
};

const toCode = (object) => {
  return new Code('' + object, {});
};

const toSymbol = (object) => {
  return new BSONSymbol('' + object);
};

const toTimestamp = (object) => {
  const number = toNumber(object);
  return Timestamp.fromNumber(number);
};

/**
 * The functions to cast to a type.
 */
const CASTERS = {
  Array: toArray,
  Binary: toBinary,
  Boolean: toBoolean,
  Code: toCode,
  Date: toDate,
  Decimal128: toDecimal128,
  Double: toDouble,
  Int32: toInt32,
  Int64: toInt64,
  MaxKey: toMaxKey,
  MinKey: toMinKey,
  Null: toNull,
  Object: toObject,
  ObjectId: toObjectID,
  BSONRegExp: toRegex,
  String: toString,
  BSONSymbol: toSymbol,
  Timestamp: toTimestamp,
  Undefined: toUndefined
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
    return result === OBJECT_TYPE && result !== object ? EMPTY : result;
  }

  /**
   * Get the type for the object.
   *
   * @param {Object} object - The object.
   *
   * @returns {String} The object type.
   */
  type(object) {
    if (hasIn(object, BSON_TYPE)) {
      if (object._bsontype === LONG) {
        return INT_64;
      }
      if (object._bsontype === OBJECT_ID) {
        return 'ObjectId';
      }
      if (object._bsontype === SYMBOL) {
        return 'BSONSymbol';
      }
      return object._bsontype;
    }
    if (isNumber(object)) {
      return numberToBsonType(object);
    }
    if (isPlainObject(object)) {
      return OBJECT;
    }
    if (isArray(object)) {
      return ARRAY;
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
