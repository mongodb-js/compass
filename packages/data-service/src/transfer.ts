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

// A null byte is illegal inside a real BSON document (both as a key and as
// UTF-8 document content), so this can never collide with an actual field
// coming back from the driver.
const bsonTypeMarker = '\x00_bsonType_\x00';

// Keyed by the exact string `markBSON` stamped on the marker (the BSON
// class's own `_bsontype` tag), used to find the right prototype to
// re-attach.
const bsonClassesByTag: Record<string, { prototype: object }> = Object.assign(
  Object.create(null),
  {
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
  }
);

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
 * opaque leaf by both `markBSON`/`unmarkBSON`, so without this they'd never
 * get visited. Pushes onto `stack` in place, doesn't need to know which
 * direction (mark/unmark) is running.
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
 * For every BSON type we need to do the opposite of markBSON
 * find the special `__mdb__bson__primitive__` value and
 * make the BSON type class from it. it's not going to be possible
 * to use the BSON's public API to do this.
 *
 * ex. { _id: ObjectId(), a: 1 }
 * // it will appear across clone as:
 * _id: { __mdb__bson__primitive__: 'ObjectId', i0: 6988827, i1: 3993407, i2: 14016419, i3: 14209164 },
 *
 * Object.setPrototypeOf(o._id, ObjectId.prototype); // lets see how far this kind of code gets us.
 */
export function unmarkBSON(res: unknown): unknown {
  const stack: unknown[] = [res];
  // Guards against shared/circular references causing an infinite loop.
  const visited = new Set<object>();

  while (stack.length > 0) {
    const item = stack.pop();

    if (item === null || typeof item !== 'object') {
      // Not an object at all (primitive, undefined, function, ...) — nothing
      // to unmark and nothing to descend into.
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (Reflect.has(item, bsonTypeMarker)) {
      const tag = Reflect.get(item, bsonTypeMarker) as string;
      // `UUID` reports the same `_bsontype: 'Binary'` tag as plain `Binary`
      // (it's implemented as a `Binary` subclass), the only way to tell them
      // apart afterwards is BSON binary sub_type 4, reserved for UUIDs.
      const bsonClass =
        tag === 'Binary' && Reflect.get(item, 'sub_type') === 4
          ? UUID
          : bsonClassesByTag[tag];

      if (bsonClass) {
        Reflect.deleteProperty(item, bsonTypeMarker);
        Reflect.setPrototypeOf(item, bsonClass.prototype);
      }
      // Whether or not we recognized the tag, this was (mostly) a BSON
      // instance's own internal fields, not a tree to enumerate further,
      // except for the handful of BSON types that nest further documents.
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
      // Native structuredClone already preserves the Map itself, only its
      // entries (either side of which could be a BSON value) need visiting.
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
      // A plain object to enumerate. Anything else (Date, RegExp, Map, Set,
      // Buffer/TypedArray, ...) is left alone, it's a leaf for our purposes.
      for (const value of Object.values(item)) {
        stack.push(value);
      }
    }
  }

  return res;
}

/**
 * In order to get BSON types across the structuredClone boundary we need to
 * make our way through the object/array etc. given here and for every BSON
 * object define a property that exists nowhere else in the tree and set it equal
 * to the name of the BSON class. We will on the other side find all these and
 * reconstruct the BSON.
 *
 * ex. { _id: ObjectId(), a: 1 }
 * // it will appear across clone as:
 * _id: { __mdb__bson__primitive__: 'ObjectId', i0: 6988827, i1: 3993407, i2: 14016419, i3: 14209164 },
 *
 * @param res - potentially any javascript value
 */
export function markBSON(res: unknown): unknown {
  const stack: unknown[] = [res];
  // Guards against shared/circular references causing an infinite loop.
  const visited = new Set<object>();

  while (stack.length > 0) {
    const item = stack.pop();

    if (item === null || typeof item !== 'object') {
      // Not an object at all (primitive, undefined, function, ...) — nothing
      // to mark and nothing to descend into.
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (Reflect.has(item, bsonType)) {
      // A BSON class instance (ObjectId, Binary, Decimal128, ...). Its own
      // internal fields aren't a tree we want to enumerate, so mark it and
      // treat it as a leaf rather than pushing its properties onto the stack,
      // except for the handful of BSON types that nest further documents.
      const tag = Reflect.get(item, bsonType) as string;
      Reflect.defineProperty(item, bsonTypeMarker, {
        value: tag,
        enumerable: true,
        writable: true,
        configurable: true,
      });
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
      // Native structuredClone already preserves the Map itself, only its
      // entries (either side of which could be a BSON value) need visiting.
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
      // A plain object to enumerate. Anything else (Date, RegExp, Map, Set,
      // Buffer/TypedArray, ...) is left alone, it's a leaf for our purposes.
      for (const value of Object.values(item)) {
        stack.push(value);
      }
    }
  }

  return res;
}
