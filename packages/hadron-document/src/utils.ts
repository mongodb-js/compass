import { EJSON } from 'bson';
import type { TypeCastMap, TypeCastTypes } from 'hadron-type-checker';

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
 * @param value Any BSON value.
 * @returns A serialized, human-readable and human-editable string.
 */
export function objectToIdiomaticEJSON(
  value: Readonly<EJSON.SerializableTypes>,
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

function makeEJSONIdiomatic(value: EJSON.SerializableTypes): void {
  if (!value || typeof value !== 'object') return;

  for (const key of Object.keys(value)) {
    const entry = (value as any)[key];
    if (entry.$numberInt) {
      (value as any)[key] = +entry.$numberInt;
      continue;
    }
    if (entry.$numberDouble) {
      (value as any)[key] = +entry.$numberDouble;
      continue;
    }
    if (key.startsWith('$')) {
      // Do not recurse into other EJSON-specific keys.
      continue;
    }
    makeEJSONIdiomatic(entry);
  }
}
