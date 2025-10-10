import {
  isPlainObject,
  isArray,
  isString,
  isNumber,
  hasIn,
  keys,
  without,
  toNumber,
  toString,
} from 'lodash';

import {
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
} from 'bson';

export type TypeCastMap = {
  Array: unknown[];
  Binary: Binary;
  Boolean: boolean;
  Code: Code;
  Date: Date;
  Decimal128: Decimal128;
  Double: Double;
  Int32: Int32;
  Int64: Long;
  MaxKey: MaxKey;
  MinKey: MinKey;
  Null: null;
  Object: Record<string, unknown>;
  ObjectId: ObjectId;
  BSONRegExp: BSONRegExp;
  String: string;
  BSONSymbol: BSONSymbol;
  Timestamp: Timestamp;
  Undefined: undefined;
};

export type TypeCastTypes = keyof TypeCastMap;
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
const NUMBER_TYPES = ['Long', 'Int32', 'Double', 'Decimal128'] as const;

const toDate = (object: unknown): Date => {
  return new Date(object as string | number | Date);
};

const toMinKey = (): MinKey => {
  return new MinKey();
};

const toMaxKey = (): MaxKey => {
  return new MaxKey();
};

const toUndefined = (): undefined => {
  return undefined;
};

const toNull = (): null => {
  return null;
};

const toBoolean = (object: unknown): boolean => {
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

const toObject = (object: unknown): Record<string, unknown> => {
  if (isPlainObject(object)) {
    return object as Record<string, unknown>;
  }
  return {};
};

const toArray = (object: unknown): unknown[] => {
  if (isArray(object)) {
    return object;
  }
  if (isPlainObject(object)) {
    return [];
  }
  return [object];
};

const toInt32 = (object: unknown): Int32 => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Int32 value`);
  }
  const number = toNumber(object);
  if (number >= BSON_INT32_MIN && number <= BSON_INT32_MAX) {
    return new Int32(number);
  }
  throw new Error(`Value ${number} is outside the valid Int32 range`);
};

const toInt64 = (object: unknown): Long => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Int64 value`);
  }

  const number = toNumber(object);

  if (number >= BSON_INT64_MIN && number <= BSON_INT64_MAX) {
    // when casting from int32 object(this will have object.value) or literal
    // (it will a typeof number) we can safely create object fromNumber, as it
    // will not be greater than JS's max value
    if ((object as { value?: number })?.value || typeof object === 'number') {
      return Long.fromNumber(number);
    } else if (
      typeof object === 'object' &&
      object !== null &&
      'toString' in object
    ) {
      // to make sure we are still displaying Very Large numbers properly, convert
      // the current 'object' to a string
      return Long.fromString((object as { toString(): string }).toString());
    }

    return Long.fromString(toString(object));
  }
  throw new Error(`Value ${toString(object)} is outside the valid Int64 range`);
};

const toDouble = (object: unknown): Double => {
  if (object === '-' || object === '') {
    throw new Error(`Value '${object}' is not a valid Double value`);
  }
  if (isString(object) && object.endsWith('.')) {
    throw new Error('Please enter at least one digit after the decimal');
  }
  const number = toNumber(object);
  return new Double(number);
};

type BSONObject = {
  _bsontype: string;
  toString(): string;
  valueOf(): number | string;
};

const toDecimal128 = (object: unknown): Decimal128 => {
  /*
   If converting a BSON Object, extract the value before converting to a string.
   */
  if (
    hasIn(object, BSON_TYPE) &&
    NUMBER_TYPES.includes(
      (object as BSONObject)._bsontype as (typeof NUMBER_TYPES)[number]
    )
  ) {
    const bsonObj = object as BSONObject;
    object =
      bsonObj._bsontype === LONG ? bsonObj.toString() : bsonObj.valueOf();
  }
  return Decimal128.fromString(toString(object));
};

const toObjectID = (object: unknown): ObjectId => {
  if (!isString(object) || object === '') {
    return new ObjectId();
  }
  return ObjectId.createFromHexString(object);
};

const toBinary = (object: unknown): Binary => {
  const buffer = ArrayBuffer.isView(object)
    ? Buffer.from(object as Uint8Array)
    : Buffer.from(toString(object), 'utf8');
  return new Binary(buffer, Binary.SUBTYPE_DEFAULT);
};

const toRegex = (object: unknown): BSONRegExp => {
  return new BSONRegExp(toString(object));
};

const toCode = (object: unknown): Code => {
  return new Code(toString(object));
};

const toSymbol = (object: unknown): BSONSymbol => {
  return new BSONSymbol(toString(object));
};

const toTimestamp = (object: unknown): Timestamp => {
  const number = toNumber(object);
  return Timestamp.fromNumber(number);
};

/**
 * The functions to cast to a type.
 */
const CASTERS: {
  [K in TypeCastTypes]: (object: unknown) => TypeCastMap[K];
} = {
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
  Undefined: toUndefined,
};

/**
 * An array of all bson types.
 */
const TYPES = keys(CASTERS);

/**
 * Checks if a string is an int32.
 */
class Int32Check {
  test(string: string): boolean {
    if (NUMBER_REGEX.test(string)) {
      const value = toNumber(string);
      return value >= BSON_INT32_MIN && value <= BSON_INT32_MAX;
    }
    return false;
  }
}

/**
 * Checks if a string is an int64.
 */
class Int64Check {
  test(string: string): boolean {
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
 */
const numberToBsonType = (number: number): TypeCastTypes => {
  const string = toString(number);
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
   */
  cast<O = unknown, T extends string = string>(
    object: O,
    type: T
  ): T extends TypeCastTypes ? TypeCastMap[T] : O {
    const caster = CASTERS[type as keyof typeof CASTERS];
    let result: unknown = object;
    if (caster) {
      result = caster(object);
    }
    return (
      result === OBJECT_TYPE && result !== object ? EMPTY : result
    ) as T extends TypeCastTypes ? TypeCastMap[T] : O;
  }

  /**
   * Get the type for the object.
   */
  type(object: unknown): TypeCastTypes {
    if (hasIn(object, BSON_TYPE)) {
      const bsonObj = object as { _bsontype: string };
      if (bsonObj._bsontype === LONG) {
        return INT_64;
      }
      if (bsonObj._bsontype === OBJECT_ID) {
        return 'ObjectId';
      }
      if (bsonObj._bsontype === SYMBOL) {
        return 'BSONSymbol';
      }
      return bsonObj._bsontype as TypeCastTypes;
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
    return Object.prototype.toString
      .call(object)
      .replace(MATCH, '$1') as TypeCastTypes;
  }

  /**
   * Get a list of types the object can be cast to.
   */
  castableTypes(highPrecisionSupport = false): TypeCastTypes[] {
    if (highPrecisionSupport === true) {
      return TYPES as TypeCastTypes[];
    }
    return without(TYPES, DECIMAL_128) as TypeCastTypes[];
  }
}

export default new TypeChecker();
