import {
  ObjectId,
  Binary,
  UUID,
  Decimal128,
  Double,
  Int32,
  Long,
  Timestamp,
  Code,
  DBRef,
  MinKey,
  MaxKey,
  BSONRegExp,
  BSONSymbol,
  bsonType,
} from 'bson';

// Keyed by the exact string `markBSON` records for each BSON class (the
// BSON class's own `_bsontype` tag), used to find the right prototype to
// re-attach with `Reflect.setPrototypeOf`.
const bsonClassesByTag: Record<string, { prototype: object }> = {
  //@ts-expect-error: null proto
  __proto__: null,
  ObjectId,
  Binary,
  UUID,
  Decimal128,
  Double,
  Int32,
  Long,
  Timestamp,
  Code,
  DBRef,
  MinKey,
  MaxKey,
  BSONRegExp,
  BSONSymbol,
};

function isSet(s: unknown): s is Set<unknown> {
  return (
    !!s &&
    typeof s === 'object' &&
    Symbol.toStringTag in s &&
    s[Symbol.toStringTag] === 'Set'
  );
}

function isMap(m: unknown): m is Map<unknown, unknown> {
  return (
    !!m &&
    typeof m === 'object' &&
    Symbol.toStringTag in m &&
    m[Symbol.toStringTag] === 'Map'
  );
}

/**
 * `Code.scope` and `DBRef.oid`/`fields` are themselves ordinary values that
 * might contain further BSON (e.g. an `ObjectId` inside a `DBRef`'s `oid` or
 * a `Code`'s `scope`). The outer `Code`/`DBRef` is otherwise treated as an
 * opaque leaf by the walk, so without this they'd never get visited.
 * Pushes onto `stack` in place.
 */
function pushNestedBsonDocuments(
  tag: string,
  item: object,
  stack: unknown[]
): void {
  if (tag === 'Code') {
    stack.push(Reflect.get(item, 'scope'));
  } else if (tag === 'DBRef') {
    stack.push(Reflect.get(item, 'oid'), Reflect.get(item, 'fields'));
  }
}

/**
 * Walks `data` and collects every BSON class instance into a `Map` keyed by
 * the instance itself, valued with its type tag string. Does NOT mutate
 * `data`. The caller must send `data` and `bsonValues` together in a single
 * `postMessage` call so that `structuredClone` preserves reference sharing
 * — after clone, objects in `data` that were BSON instances will be `===`
 * to their degraded counterpart in the cloned `bsonValues` Map.
 */
export function markBSON(data: unknown): {
  data: unknown;
  bsonValues: Map<object, string>;
} {
  const bsonValues = new Map<object, string>();
  const stack: unknown[] = [data];
  const visited = new Set<object>();

  while (stack.length > 0) {
    const item = stack.pop();

    if (item === null || typeof item !== 'object') {
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (Reflect.has(item, bsonType)) {
      const tag = Reflect.get(item, bsonType) as string;
      // `UUID` reports the same `_bsontype: 'Binary'` tag as plain `Binary`;
      // record it as 'UUID' so the unmark side restores the right prototype.
      const recordedTag =
        tag === 'Binary' && Reflect.get(item, 'sub_type') === 4 ? 'UUID' : tag;

      if (!bsonValues.has(item)) {
        bsonValues.set(item, recordedTag);
      }

      pushNestedBsonDocuments(tag, item, stack);
      continue;
    }

    if (Array.isArray(item)) {
      for (const value of item) {
        stack.push(value);
      }
      continue;
    }

    if (isMap(item)) {
      for (const [key, value] of item) {
        stack.push(key, value);
      }
      continue;
    }

    if (isSet(item)) {
      for (const value of item) {
        stack.push(value);
      }
      continue;
    }

    const proto = Reflect.getPrototypeOf(item);
    if (proto === Object.prototype || proto === null) {
      for (const value of Object.values(item)) {
        stack.push(value);
      }
    }
  }

  return { data, bsonValues };
}

/**
 * Walks `data` and restores BSON class prototypes in-place using the type
 * information in `bsonValues`. The Map must have traveled through the same
 * `structuredClone` call as `data` so that reference identity is preserved
 * — objects in `data` that were BSON instances will be `===` to their
 * degraded counterpart key in the Map.
 */
export function unmarkBSON(
  data: unknown,
  bsonValues: Map<object, string>
): unknown {
  const stack: unknown[] = [data];
  const visited = new Set<object>();

  while (stack.length > 0) {
    const item = stack.pop();

    if (item === null || typeof item !== 'object') {
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    const tag = bsonValues.get(item);
    if (tag !== undefined) {
      const bsonClass = bsonClassesByTag[tag];
      if (bsonClass) {
        Reflect.setPrototypeOf(item, bsonClass.prototype);
      }
      // Whether or not we recognized the tag, this was a BSON instance's
      // own internal fields, not a tree to enumerate further, except for
      // the handful of BSON types that nest further documents.
      pushNestedBsonDocuments(tag, item, stack);
      continue;
    }

    if (Array.isArray(item)) {
      for (const value of item) {
        stack.push(value);
      }
      continue;
    }

    if (isMap(item)) {
      for (const [key, value] of item) {
        stack.push(key, value);
      }
      continue;
    }

    if (isSet(item)) {
      for (const value of item) {
        stack.push(value);
      }
      continue;
    }

    const proto = Reflect.getPrototypeOf(item);
    if (proto === Object.prototype || proto === null) {
      for (const value of Object.values(item)) {
        stack.push(value);
      }
    }
  }

  return data;
}
