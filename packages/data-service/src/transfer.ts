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
  type BSONValue,
} from 'bson';

// Keyed by the exact string `prepareForTransfer` records for each BSON class
// (the BSON class's own `_bsontype` tag), used to find the right prototype to
// re-attach with `Object.setPrototypeOf`.
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

const BASE_PROTO = Object.prototype;

/** Assign `value` into `parent` at `key`, inspecting the parent's type to
 * pick the right mechanism (index, property, Map.set, or Set delete+add). */
function assignTo(parent: object, key: unknown, value: unknown): void {
  if (isMap(parent)) {
    parent.set(key, value);
  } else if (isSet(parent)) {
    // Set members are identified by value, so `key` is the original member
    // we need to delete before adding the replacement.
    parent.delete(key);
    parent.add(value);
  } else {
    // Arrays and plain objects both use bracket assignment
    (parent as Record<PropertyKey, unknown>)[key as PropertyKey] = value;
  }
}

/** Stack entry: the value being visited, plus enough context to write a
 * replacement back into whatever container it came from. No closures. */
type StackEntry = { value: unknown; parent: object; key: unknown };

function pushChild(stack: StackEntry[], parent: object, key: unknown): void {
  stack.push({
    value: (parent as Record<PropertyKey, unknown>)[key as PropertyKey],
    parent,
    key,
  });
}

/**
 * `Code.scope` and `DBRef.oid`/`fields` are themselves ordinary values that
 * might contain further BSON. The outer `Code`/`DBRef` is otherwise treated
 * as an opaque leaf by the walk, so without this they'd never get visited.
 * Pushes `StackEntry` objects onto `stack` in place.
 */
function pushNestedBsonDocuments(
  tag: string,
  item: object,
  stack: StackEntry[]
): void {
  if (tag === 'Code') {
    pushChild(stack, item, 'scope');
  } else if (tag === 'DBRef') {
    pushChild(stack, item, 'oid');
    pushChild(stack, item, 'fields');
  }
}

/**
 * Walks `data` and:
 *  - Collects every BSON class instance (including those nested inside
 *    `Code.scope` / `DBRef.oid` / `DBRef.fields`) into a `Map` keyed by the
 *    instance, valued with its type tag string.
 *  - Replaces every uncloneable value (`AbortSignal`, which makes
 *    `structuredClone` throw `DataCloneError`) with a freshly allocated
 *    placeholder object, collecting the placeholder and the original value
 *    side-by-side.
 *
 * Does NOT mutate `data` for BSON values (they degrade naturally during
 * clone). DOES mutate `data` for AbortSignals (replaces them with
 * placeholders, which is required because clone throws on them).
 *
 * The caller must send `data`, `bsonValues`, and `placeholders` together in a
 * single `postMessage` call so that `structuredClone` preserves reference
 * sharing — after clone, BSON instances in `data` are `===` to their key in
 * `bsonValues`, and placeholder objects in `data` are `===` to their entry in
 * `placeholders`. The `signals` array stays local.
 */
export function prepareForTransfer(data: unknown): {
  data: unknown;
  bsonValues: Map<object, string>;
  signals: AbortSignal[];
  placeholders: object[];
} {
  const bsonValues = new Map<object, string>();
  const signals: AbortSignal[] = [];
  const placeholders: object[] = [];
  // Wrap the root so a top-level uncloneable can be replaced via `assignTo`
  // without a special case.
  const root = { root: data };
  const stack: StackEntry[] = [{ value: data, parent: root, key: 'root' }];
  const visited = new Set<object>();

  while (stack.length > 0) {
    const { value: item, parent, key } = stack.pop()!;

    if (item === null || typeof item !== 'object') {
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (bsonType in item) {
      const tag = (item as BSONValue)[bsonType];
      const recordedTag =
        tag === 'Binary' && (item as Binary).sub_type === 4 ? 'UUID' : tag;

      if (!bsonValues.has(item)) {
        bsonValues.set(item, recordedTag);
      }

      pushNestedBsonDocuments(tag, item, stack);
      continue;
    }

    if (item instanceof AbortSignal) {
      const placeholder = {};
      assignTo(parent, key, placeholder);
      signals.push(item);
      placeholders.push(placeholder);
      continue;
    }

    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) {
        stack.push({ value: item[i], parent: item, key: i });
      }
      continue;
    }

    if (isMap(item)) {
      for (const [k, v] of item) {
        // Push the key as a value so BSON types in keys are collected;
        // uncloneable Map keys are not supported (would need replace of the
        // key itself, not the value).
        stack.push({ value: k, parent: item, key: k });
        stack.push({ value: v, parent: item, key: k });
      }
      continue;
    }

    if (isSet(item)) {
      for (const member of item) {
        stack.push({ value: member, parent: item, key: member });
      }
      continue;
    }

    const proto = Object.getPrototypeOf(item);
    if (proto === BASE_PROTO || proto === null) {
      for (const k of Object.keys(item)) {
        stack.push({
          value: (item as Record<string, unknown>)[k],
          parent: item,
          key: k,
        });
      }
    }
  }

  return { data: root.root, bsonValues, signals, placeholders };
}

/**
 * Restores everything that `prepareForTransfer` extracted:
 *  - BSON: loops the `bsonValues` Map keys and re-attaches prototypes — no
 *    tree walk needed, the keys *are* the instances in `data`.
 *  - Uncloneables: finds the placeholder objects in `data` via instance
 *    equality (identity with the shipped `placeholders` array), swaps in a
 *    freshly created `AbortController().signal`, and returns the controllers
 *    so the caller can wire up abort propagation.
 *
 * BSON instances that have been restored are treated as leaves by the
 * placeholder walk — nothing inside them could be a shipped placeholder.
 */
export function readTransfer(
  data: unknown,
  bsonValues: Map<object, string>,
  placeholders: readonly object[]
): { data: unknown; controllers: AbortController[] } {
  // Restore BSON prototypes by identity — iterate the Map keys directly.
  for (const [item, tag] of bsonValues) {
    const bsonClass = bsonClassesByTag[tag];
    if (bsonClass) {
      Object.setPrototypeOf(item, bsonClass.prototype);
    }
  }

  const controllers: AbortController[] = [];
  if (placeholders.length === 0) {
    return { data, controllers };
  }

  const placeholderSet = new Set<object>(placeholders);
  const root = { root: data };
  const stack: StackEntry[] = [{ value: data, parent: root, key: 'root' }];
  const visited = new Set<object>();

  while (stack.length > 0) {
    const { value: item, parent, key } = stack.pop()!;

    if (item === null || typeof item !== 'object') {
      continue;
    }

    if (visited.has(item)) {
      continue;
    }
    visited.add(item);

    if (placeholderSet.has(item)) {
      const controller = new AbortController();
      assignTo(parent, key, controller.signal);
      controllers.push(controller);
      continue;
    }

    if (Array.isArray(item)) {
      for (let i = 0; i < item.length; i++) {
        stack.push({ value: item[i], parent: item, key: i });
      }
      continue;
    }

    if (isMap(item)) {
      for (const [k, v] of item) {
        stack.push({ value: k, parent: item, key: k });
        stack.push({ value: v, parent: item, key: k });
      }
      continue;
    }

    if (isSet(item)) {
      for (const member of item) {
        stack.push({ value: member, parent: item, key: member });
      }
      continue;
    }

    const proto = Object.getPrototypeOf(item);
    if (proto === BASE_PROTO || proto === null) {
      for (const k of Object.keys(item)) {
        stack.push({
          value: (item as Record<string, unknown>)[k],
          parent: item,
          key: k,
        });
      }
    }
  }

  return { data: root.root, controllers };
}
