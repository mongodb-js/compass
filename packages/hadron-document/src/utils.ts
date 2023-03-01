import { EJSON } from 'bson';
import TypeChecker from 'hadron-type-checker';
import type { TypeCastMap, TypeCastTypes } from 'hadron-type-checker';

const UNCASTED_EMPTY_TYPE_VALUE: {
  [T in TypeCastTypes]: unknown;
} = {
  Array: [],
  Object: {},
  Decimal128: 0,
  Int32: 0,
  Int64: 0,
  Double: 0,
  MaxKey: 0,
  MinKey: 0,
  Timestamp: 0,
  Date: 0,
  String: '',
  Code: '',
  Binary: '',
  ObjectId: '',
  BSONRegExp: '',
  BSONSymbol: '',
  Boolean: false,
  Undefined: undefined,
  Null: null,
};

const maxFourYearDate = new Date('9999-12-31T23:59:59.999Z').valueOf();

export function fieldStringLen(value: unknown): number {
  const length = String(value).length;
  return length === 0 ? 1 : length;
}

export type BSONObject = TypeCastMap['Object'];
export type BSONArray = TypeCastMap['Array'];
export type BSONValue = TypeCastMap[TypeCastTypes];

export interface HadronEJSONOptions {
  indent?: number | string;
}

/**
 * Turn a BSON value into what we consider idiomatic extended JSON.
 *
 * This differs from both the relaxed and strict mode of the 'bson'
 * package's EJSON class: We preserve the type information for longs
 * via $numberLong, but redact it for $numberInt and $numberDouble.
 *
 * This may seem inconsistent, but considering that the latter two
 * types are exactly representable in JS and $numberLong is not,
 * in addition to the fact that this has been historic behavior
 * in Compass for a long time, this seems like a reasonable choice.
 *
 * Also turns $date.$numberLong into a date so that it will be
 * displayed as an iso date string since this is what Compass did
 * historically. Unless it is outside of the safe range.
 *
 * @param value Any BSON value.
 * @returns A serialized, human-readable and human-editable string.
 */
export function objectToIdiomaticEJSON(
  value: any,
  options: HadronEJSONOptions = {}
): string {
  const serialized = EJSON.serialize(value, {
    relaxed: false,
  });

  makeEJSONIdiomatic(serialized);

  return JSON.stringify(
    serialized,
    null,
    'indent' in options ? options.indent : 2
  );
}

function makeEJSONIdiomatic(value: any): void {
  if (!value || typeof value !== 'object') return;

  for (const key of Object.keys(value)) {
    const entry = value[key];
    // We are only interested in object-like values, skip everything else
    if (typeof entry !== 'object' || entry === null) {
      continue;
    }
    if (entry.$numberInt) {
      value[key] = +entry.$numberInt;
      continue;
    }
    if (entry.$numberDouble) {
      if (
        Number.isFinite(+entry.$numberDouble) &&
        !Object.is(+entry.$numberDouble, -0)
      ) {
        // EJSON can represent +/-Infinity or NaN values but JSON can't
        // (and -0 can be parsed from JSON but not serialized by JSON.stringify).
        value[key] = +entry.$numberDouble;
      }
      continue;
    }
    if (entry.$date && entry.$date.$numberLong) {
      const number = entry.$date.$numberLong;
      if (number >= 0 && number <= maxFourYearDate) {
        entry.$date = new Date(+number).toISOString();
      }
    }
    makeEJSONIdiomatic(entry);
  }
}

/**
 * Returns a default value for the BSON type passed in.
 */
export function getDefaultValueForType(type: keyof TypeCastMap) {
  return TypeChecker.cast(UNCASTED_EMPTY_TYPE_VALUE[type], type);
}
