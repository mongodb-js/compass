import { EJSON } from 'bson';
import { toJSString } from 'mongodb-query-parser';

const EJSON_SHELL_EQUIVALENTS = new Map([
  ['$oid', 'ObjectId()'],
  ['$symbol', 'BSONSymbol()'],
  // Shell would show the regular number. Here we go strict,
  // although shell in a stricter mode would likely be Int32()
  ['$numberInt', 'NumberInt()'],
  // TODO(COMPASS-10968): Long() instead of NumberLong()
  ['$numberLong', 'NumberLong()'],
  // Shell would show just the number itself.
  ['$numberDouble', 'Double()'],
  // Shell would show this as `Decimal128()`
  ['$numberDecimal', 'Decimal128()'],
  ['$binary', 'Binary()'],
  ['$code', 'Code()'],
  ['$timestamp', 'Timestamp()'],
  // Shell would show this in the /pattern/ format.
  ['$regularExpression', 'RegExp()'],
  ['$date', 'ISODate()'],
  ['$minKey', 'MinKey()'],
  ['$maxKey', 'MaxKey()'],
]);

function* allKeys(doc: unknown): Iterable<string> {
  if (
    typeof doc !== 'object' ||
    !doc ||
    ('_bsontype' in doc && doc._bsontype)
  ) {
    return;
  }
  if (Array.isArray(doc)) {
    for (const item of doc) yield* allKeys(item);
    return;
  }
  for (const [key, value] of Object.entries(doc)) {
    yield key;
    yield* allKeys(value);
  }
}

/**
 * Find the first key that indicates the parsed document was meant to be
 * Extended JSON rather than shell syntax, along with the shell syntax that
 * would express the same value.
 *
 * Only keys from the fixed list above are ever returned, so no text from the
 * document itself ends up being rendered.
 */
export function getAccidentalEJSONKey(
  parsed: unknown
): { key: string; shellEquivalent: string } | null {
  for (const key of allKeys(parsed)) {
    const shellEquivalent = EJSON_SHELL_EQUIVALENTS.get(key);
    if (shellEquivalent) return { key, shellEquivalent };
  }
  return null;
}

/**
 * Rewrite the Extended JSON in an already parsed document as shell syntax,
 * keeping the BSON types intact.
 *
 * The round trip goes through Extended JSON rather than `EJSON.deserialize`,
 * which is implemented as `EJSON.parse(JSON.stringify(doc))`: plain
 * `JSON.stringify` calls `toJSON()` on anything that already parsed as a BSON
 * value, so in a document that mixes the two syntaxes an `ObjectId` would
 * degrade to its hex string, a `Date` to an ISO string, a `Long` to
 * `{ high, low, unsigned }`, and a `Timestamp` would throw outright.
 *
 * Throws if the document contains Extended JSON that cannot be deserialized,
 * for example `{ "$oid": "not-a-valid-object-id" }`.
 */
export function convertEJSONToShellSyntax(parsed: unknown): string {
  const converted = toJSString(
    EJSON.parse(EJSON.stringify(parsed, { relaxed: false }), {
      relaxed: false,
    })
  );
  if (converted === undefined) {
    throw new Error('The converted document could not be serialized.');
  }
  return converted;
}
