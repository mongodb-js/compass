import {
  isPlainObject,
  isArray,
  isString,
  isNumber,
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
  UUID,
  bsonType,
  type BSONTypeTag,
} from 'bson';

export { bsonType, type BSONTypeTag };
export function getBsonType(value: any): BSONTypeTag | undefined {
  return value?.[bsonType];
}

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
  UUID: Binary;
  LegacyJavaUUID: Binary;
  LegacyCSharpUUID: Binary;
  LegacyPythonUUID: Binary;
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
  toString(): string;
  valueOf(): number | string;
};

const toDecimal128 = (object: unknown): Decimal128 => {
  /*
   If converting a BSON Object, extract the value before converting to a string.
   */
  if (
    (NUMBER_TYPES as readonly (BSONTypeTag | undefined)[]).includes(
      getBsonType(object)
    )
  ) {
    const bsonObj = object as BSONObject;
    object =
      getBsonType(object) === LONG ? bsonObj.toString() : bsonObj.valueOf();
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

/**
 * UUID regex pattern for validation (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx).
 */
export const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Validates a UUID string format.
 */
const validateUUIDString = (uuidString: string): void => {
  if (!UUID_REGEX.test(uuidString)) {
    throw new Error(
      `'${uuidString}' is not a valid UUID string (expected format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)`
    );
  }
};

/**
 * Converts a UUID string (with hyphens) to a hex string (without hyphens).
 */
const uuidStringToHex = (uuidString: string): string => {
  return uuidString.replace(/-/g, '');
};

/**
 * Converts a hex string (without hyphens) to UUID format with hyphens.
 */
export const uuidHexToString = (hex: string): string => {
  return (
    hex.substring(0, 8) +
    '-' +
    hex.substring(8, 12) +
    '-' +
    hex.substring(12, 16) +
    '-' +
    hex.substring(16, 20) +
    '-' +
    hex.substring(20, 32)
  );
};

/**
 * Reverses byte order for Java legacy UUID format (both MSB and LSB).
 * Takes a 32-char hex string and returns a 32-char hex string with reversed byte order.
 *
 * This function is an involution (self-inverse), meaning applying it twice returns
 * the original value. It can be used both to:
 * - Convert from Java legacy binary format to standard UUID hex (for display)
 * - Convert from standard UUID hex to Java legacy binary format (for storage)
 */
export const reverseJavaUUIDBytes = (hex: string): string => {
  let msb = hex.substring(0, 16);
  let lsb = hex.substring(16, 32);
  msb =
    msb.substring(14, 16) +
    msb.substring(12, 14) +
    msb.substring(10, 12) +
    msb.substring(8, 10) +
    msb.substring(6, 8) +
    msb.substring(4, 6) +
    msb.substring(2, 4) +
    msb.substring(0, 2);
  lsb =
    lsb.substring(14, 16) +
    lsb.substring(12, 14) +
    lsb.substring(10, 12) +
    lsb.substring(8, 10) +
    lsb.substring(6, 8) +
    lsb.substring(4, 6) +
    lsb.substring(2, 4) +
    lsb.substring(0, 2);
  return msb + lsb;
};

/**
 * Reverses byte order for C# legacy UUID format (first 3 groups only).
 * Takes a 32-char hex string and returns a 32-char hex string with reversed byte order.
 *
 * This function is an involution (self-inverse), meaning applying it twice returns
 * the original value. It can be used both to:
 * - Convert from C# legacy binary format to standard UUID hex (for display)
 * - Convert from standard UUID hex to C# legacy binary format (for storage)
 */
export const reverseCSharpUUIDBytes = (hex: string): string => {
  const a =
    hex.substring(6, 8) +
    hex.substring(4, 6) +
    hex.substring(2, 4) +
    hex.substring(0, 2);
  const b = hex.substring(10, 12) + hex.substring(8, 10);
  const c = hex.substring(14, 16) + hex.substring(12, 14);
  const d = hex.substring(16, 32);
  return a + b + c + d;
};

/**
 * Generates a random UUID string in the format xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx.
 */
const generateRandomUUID = (): string => {
  return new UUID().toString();
};

/**
 * Converts a Binary UUID to a standard UUID string, accounting for its encoding.
 * For subtype 4 (standard UUID), returns the hex directly as UUID format.
 * For subtype 3 (legacy UUID), we need to know the original encoding to reverse the bytes.
 * If sourceEncoding is not provided, assumes Python encoding (no reversal).
 */
const binaryToUUIDStringWithEncoding = (
  binary: Binary,
  sourceEncoding?: 'Java' | 'CSharp' | 'Python'
): string => {
  const hex = binary.toString('hex');

  // For standard UUID (subtype 4), no byte reversal needed
  if (binary.sub_type === Binary.SUBTYPE_UUID) {
    return uuidHexToString(hex);
  }

  // For legacy UUID (subtype 3), reverse bytes based on source encoding
  switch (sourceEncoding) {
    case 'Java':
      // Reverse Java encoding to get standard UUID
      return uuidHexToString(reverseJavaUUIDBytes(hex));
    case 'CSharp':
      // Reverse C# encoding to get standard UUID
      return uuidHexToString(reverseCSharpUUIDBytes(hex));
    case 'Python':
    default:
      // Python uses standard byte order, no reversal needed
      return uuidHexToString(hex);
  }
};

/**
 * Gets the UUID string from an object, handling Binary inputs specially.
 * For Binary inputs, extracts and converts to UUID string format.
 * For string inputs, returns as-is after trimming.
 */
const getUUIDStringFromObject = (
  object: unknown,
  sourceEncoding?: 'Java' | 'CSharp' | 'Python'
): string => {
  if (object instanceof Binary) {
    if (
      object.sub_type === Binary.SUBTYPE_UUID ||
      object.sub_type === Binary.SUBTYPE_UUID_OLD
    ) {
      return binaryToUUIDStringWithEncoding(object, sourceEncoding);
    }
  }
  return toString(object).trim();
};

/**
 * Mapping from UUID type names to encoding names.
 */
const UUID_TYPE_TO_ENCODING: Record<
  string,
  'Java' | 'CSharp' | 'Python' | undefined
> = Object.assign(Object.create(null), {
  UUID: undefined,
  LegacyJavaUUID: 'Java',
  LegacyCSharpUUID: 'CSharp',
  LegacyPythonUUID: 'Python',
});

/**
 * Converts a Binary UUID from one encoding to another.
 * This is used when changing between UUID types in the document editor.
 *
 * @param binary - The source Binary UUID
 * @param sourceType - The source UUID type (e.g., 'LegacyCSharpUUID')
 * @param targetType - The target UUID type (e.g., 'LegacyJavaUUID')
 * @returns A new Binary with the same UUID value but different encoding
 */
export const convertBinaryUUID = (
  binary: Binary,
  sourceType: string,
  targetType: string
): Binary => {
  // Get the source encoding to decode the binary
  const sourceEncoding = UUID_TYPE_TO_ENCODING[sourceType];

  // Convert binary to standard UUID string using source encoding
  const uuidString = binaryToUUIDStringWithEncoding(binary, sourceEncoding);

  // Convert UUID string to binary using target encoding
  const hex = uuidStringToHex(uuidString);

  switch (targetType) {
    case 'UUID':
      return Binary.createFromHexString(hex, Binary.SUBTYPE_UUID);
    case 'LegacyJavaUUID':
      return Binary.createFromHexString(
        reverseJavaUUIDBytes(hex),
        Binary.SUBTYPE_UUID_OLD
      );
    case 'LegacyCSharpUUID':
      return Binary.createFromHexString(
        reverseCSharpUUIDBytes(hex),
        Binary.SUBTYPE_UUID_OLD
      );
    case 'LegacyPythonUUID':
      return Binary.createFromHexString(hex, Binary.SUBTYPE_UUID_OLD);
    default:
      throw new Error(`Unknown UUID type: ${targetType}`);
  }
};

/**
 * Converts to UUID (Binary subtype 4).
 * If the input is empty, generates a random UUID.
 * If the input is a Binary, extracts the UUID from it.
 */
const toUUID = (object: unknown): Binary => {
  const uuidString = getUUIDStringFromObject(object);
  if (!uuidString) {
    return new UUID().toBinary();
  }
  validateUUIDString(uuidString);
  const hex = uuidStringToHex(uuidString);
  return Binary.createFromHexString(hex, Binary.SUBTYPE_UUID);
};

/**
 * Converts to Legacy Java UUID (Binary subtype 3).
 * Java legacy format reverses byte order for both MSB and LSB.
 * If the input is empty, generates a random UUID.
 * If the input is a Binary, extracts the UUID from it.
 */
const toLegacyJavaUUID = (object: unknown): Binary => {
  let uuidString = getUUIDStringFromObject(object, 'Java');
  if (!uuidString) {
    uuidString = generateRandomUUID();
  } else {
    validateUUIDString(uuidString);
  }
  const hex = uuidStringToHex(uuidString);
  const reversedHex = reverseJavaUUIDBytes(hex);
  return Binary.createFromHexString(reversedHex, Binary.SUBTYPE_UUID_OLD);
};

/**
 * Converts to Legacy C# UUID (Binary subtype 3).
 * C# legacy format reverses byte order for first 3 groups only.
 * If the input is empty, generates a random UUID.
 * If the input is a Binary, extracts the UUID from it.
 */
const toLegacyCSharpUUID = (object: unknown): Binary => {
  let uuidString = getUUIDStringFromObject(object, 'CSharp');
  if (!uuidString) {
    uuidString = generateRandomUUID();
  } else {
    validateUUIDString(uuidString);
  }
  const hex = uuidStringToHex(uuidString);
  const reversedHex = reverseCSharpUUIDBytes(hex);
  return Binary.createFromHexString(reversedHex, Binary.SUBTYPE_UUID_OLD);
};

/**
 * Converts to Legacy Python UUID (Binary subtype 3).
 * Python legacy format uses direct byte order (no reversal).
 * If the input is empty, generates a random UUID.
 * If the input is a Binary, extracts the UUID from it.
 */
const toLegacyPythonUUID = (object: unknown): Binary => {
  let uuidString = getUUIDStringFromObject(object, 'Python');
  if (!uuidString) {
    uuidString = generateRandomUUID();
  } else {
    validateUUIDString(uuidString);
  }
  const hex = uuidStringToHex(uuidString);
  return Binary.createFromHexString(hex, Binary.SUBTYPE_UUID_OLD);
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
  UUID: toUUID,
  LegacyJavaUUID: toLegacyJavaUUID,
  LegacyCSharpUUID: toLegacyCSharpUUID,
  LegacyPythonUUID: toLegacyPythonUUID,
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
   * @param legacyUUIDEncoding - Optional encoding for legacy UUID (subtype 3).
   *   If provided and the object is a Binary with subtype 3, returns the specific legacy UUID type.
   *   Valid values: 'LegacyJavaUUID', 'LegacyCSharpUUID', 'LegacyPythonUUID'
   */
  type(
    object: unknown,
    legacyUUIDEncoding?:
      | 'LegacyJavaUUID'
      | 'LegacyCSharpUUID'
      | 'LegacyPythonUUID'
  ): TypeCastTypes {
    const bsonType = getBsonType(object);
    if (bsonType) {
      if (bsonType === LONG) {
        return INT_64;
      }
      // Handle Binary UUID subtypes
      if (bsonType === 'Binary') {
        const binary = object as Binary;
        if (binary.sub_type === Binary.SUBTYPE_UUID) {
          return 'UUID';
        }
        if (
          binary.sub_type === Binary.SUBTYPE_UUID_OLD &&
          binary.buffer.length === 16 &&
          legacyUUIDEncoding
        ) {
          return legacyUUIDEncoding;
        }
      }
      return bsonType as TypeCastTypes;
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
