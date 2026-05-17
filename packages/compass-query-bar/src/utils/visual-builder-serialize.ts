import { toJSString } from 'mongodb-query-parser';
import type { Document } from 'mongodb';
import type { VisualBuilderOperator } from '../constants/visual-builder-operators';

// MIME type used for cross-plugin value drags (document grid -> visual builder).
// Kept in sync with the inlined consumers in
// `packages/compass-components/src/components/document-list/element.tsx` and
// `packages/compass-crud/src/components/table-view/cell-renderer.tsx`.
export const VALUE_DRAG_MIME_TYPE = 'application/x-mongodb-value';

export type ValueDragPayload = {
  path: string;
  bsonType: string;
  valueString: string;
};

// BSON types whose values can be meaningfully dragged into a flat filter rule.
// Object / Array / Binary / Code etc. are intentionally excluded — they don't
// map to a single $eq scalar.
export const PRIMITIVE_BSON_TYPES = [
  'String',
  'Number',
  'Int32',
  'Int64',
  'Long',
  'Double',
  'Decimal128',
  'Date',
  'ObjectId',
  'ObjectID',
  'Boolean',
] as const;

export function isPrimitiveBsonType(bsonType: string): boolean {
  return (PRIMITIVE_BSON_TYPES as readonly string[]).includes(bsonType);
}

// Format a raw BSON / JS value into the canonical text form the visual builder
// would expect the user to type. Returning '' signals "not draggable" — the
// caller should skip emitting a drag payload.
export function formatValueForVisualBuilder(
  value: unknown,
  bsonType: string
): string {
  if (value === null || value === undefined) return '';
  switch (bsonType) {
    case 'Date': {
      if (value instanceof Date) {
        return Number.isNaN(value.getTime()) ? '' : value.toISOString();
      }
      const d = new Date(value as string | number);
      return Number.isNaN(d.getTime()) ? String(value) : d.toISOString();
    }
    case 'ObjectId':
    case 'ObjectID': {
      const v = value as { toHexString?: () => string };
      return typeof v.toHexString === 'function'
        ? v.toHexString()
        : String(value);
    }
    case 'Boolean':
      return String(Boolean(value));
    case 'String':
      return String(value);
    case 'Number':
    case 'Int32':
    case 'Int64':
    case 'Long':
    case 'Double':
    case 'Decimal128': {
      const v = value as { toString?: () => string };
      return typeof v?.toString === 'function' ? v.toString() : String(value);
    }
    default:
      return '';
  }
}

export function parseValueDragPayload(
  transfer: DataTransfer
): ValueDragPayload | null {
  let raw = '';
  try {
    raw = transfer.getData(VALUE_DRAG_MIME_TYPE);
  } catch {
    return null;
  }
  if (!raw) return null;
  try {
    const obj = JSON.parse(raw) as Partial<ValueDragPayload>;
    if (
      typeof obj?.path === 'string' &&
      typeof obj?.bsonType === 'string' &&
      typeof obj?.valueString === 'string'
    ) {
      return obj as ValueDragPayload;
    }
  } catch {
    /* malformed payload — silently ignore */
  }
  return null;
}

export type FilterRule = {
  id: string;
  path: string;
  bsonType: string;
  operator: VisualBuilderOperator;
  valueString: string;
  value: unknown;
  valid: boolean;
};

export type FilterCombinator = '$and' | '$or';

export type ProjectionEntry = {
  id: string;
  path: string;
  mode: 0 | 1;
};

export type SortEntry = {
  id: string;
  path: string;
  direction: 1 | -1;
};

// Coerce a single token (as typed by the user) to the value type implied by
// the field's BSON type. Unknown types fall through as the raw string.
export function coerceScalar(raw: string, bsonType: string): unknown {
  const trimmed = raw.trim();
  switch (bsonType) {
    case 'Number':
    case 'Double':
    case 'Int32':
    case 'Long':
    case 'Decimal128': {
      if (trimmed === '') return undefined;
      const n = Number(trimmed);
      return Number.isNaN(n) ? undefined : n;
    }
    case 'Boolean': {
      if (trimmed === 'true') return true;
      if (trimmed === 'false') return false;
      return undefined;
    }
    case 'Null':
      return null;
    case 'Date': {
      if (trimmed === '') return undefined;
      const d = new Date(trimmed);
      return Number.isNaN(d.getTime()) ? undefined : d;
    }
    default:
      return trimmed;
  }
}

function ruleClauseValue(rule: FilterRule): unknown {
  if (rule.operator === '$exists') {
    return { $exists: rule.value === false ? false : true };
  }
  if (rule.operator === '$size') {
    const size = Number(rule.valueString);
    return { $size: Number.isNaN(size) ? 0 : size };
  }
  if (rule.operator === '$regex') {
    const [pattern, flags] = rule.valueString.split('/');
    const out: Document = { $regex: pattern ?? rule.valueString };
    if (flags) {
      out.$options = flags;
    }
    return out;
  }
  if (rule.operator === '$in' || rule.operator === '$nin') {
    const items = rule.valueString
      .split(',')
      .map((token) => coerceScalar(token, rule.bsonType))
      .filter((v) => v !== undefined);
    return { [rule.operator]: items };
  }
  if (rule.operator === '$eq') {
    // Collapse `$eq: x` to plain `x` for the most natural shape on the wire.
    return coerceScalar(rule.valueString, rule.bsonType);
  }
  return { [rule.operator]: coerceScalar(rule.valueString, rule.bsonType) };
}

function isValidRule(rule: FilterRule): boolean {
  if (!rule.valid) return false;
  if (rule.operator === '$exists') return true;
  if (rule.operator === '$size') {
    return !Number.isNaN(Number(rule.valueString));
  }
  if (rule.operator === '$regex') {
    return rule.valueString.trim() !== '';
  }
  if (rule.operator === '$in' || rule.operator === '$nin') {
    return rule.valueString.trim() !== '';
  }
  return rule.valueString.trim() !== '';
}

export function serializeFilter(
  rules: readonly FilterRule[],
  combinator: FilterCombinator
): string {
  const valid = rules.filter(isValidRule);
  if (valid.length === 0) {
    return '';
  }

  const clauses = valid.map((rule) => ({ [rule.path]: ruleClauseValue(rule) }));

  let obj: Document;
  if (clauses.length === 1) {
    obj = clauses[0];
  } else {
    obj = { [combinator]: clauses };
  }
  return toJSString(obj, 0) ?? '';
}

export function serializeProjection(
  entries: readonly ProjectionEntry[]
): string {
  if (entries.length === 0) return '';
  const obj: Document = {};
  for (const entry of entries) {
    obj[entry.path] = entry.mode;
  }
  return toJSString(obj, 0) ?? '';
}

export function serializeSort(entries: readonly SortEntry[]): string {
  if (entries.length === 0) return '';
  const obj: Document = {};
  for (const entry of entries) {
    obj[entry.path] = entry.direction;
  }
  return toJSString(obj, 0) ?? '';
}

// Decide whether the given parsed filter/projection/sort document can be
// represented in the visual builder's flat v1 model. Used to flip the
// `representable` flag when the text inputs are edited from outside the
// builder.
export function isFilterRepresentable(filter: unknown): boolean {
  if (filter === null || filter === undefined) return true;
  if (typeof filter !== 'object') return false;
  const doc = filter as Document;

  // Single-rule shape: { path: scalar } or { path: { $op: value } } — both OK.
  const keys = Object.keys(doc);
  if (keys.length === 0) return true;

  // Multiple top-level keys collapse to an implicit AND of leaf rules; allow
  // only when every key is a representable leaf (no top-level $expr/$where etc).
  if (
    keys.includes('$expr') ||
    keys.includes('$where') ||
    keys.includes('$jsonSchema') ||
    keys.includes('$text') ||
    keys.includes('$nor')
  ) {
    return false;
  }

  if (keys.length === 1 && (keys[0] === '$and' || keys[0] === '$or')) {
    const clauses = doc[keys[0]];
    if (!Array.isArray(clauses)) return false;
    return clauses.every((clause) => isRepresentableLeaf(clause));
  }

  return keys.every((k) => isRepresentableLeaf({ [k]: doc[k] }));
}

function isRepresentableLeaf(clause: unknown): boolean {
  if (clause === null || typeof clause !== 'object') return false;
  const keys = Object.keys(clause);
  if (keys.length !== 1) return false;
  const path = keys[0];
  if (path.startsWith('$')) return false;
  const value = (clause as Document)[path];
  if (value === null || typeof value !== 'object') return true; // scalar shorthand
  // Operator object shape; only allow a single representable operator.
  const opKeys = Object.keys(value as Document);
  if (opKeys.length === 0) return true;
  // Allow {$regex, $options} as a pair.
  if (
    opKeys.length === 2 &&
    opKeys.includes('$regex') &&
    opKeys.includes('$options')
  ) {
    return true;
  }
  if (opKeys.length > 1) return false;
  const op = opKeys[0];
  const allowed = new Set<string>([
    '$eq',
    '$ne',
    '$gt',
    '$gte',
    '$lt',
    '$lte',
    '$in',
    '$nin',
    '$regex',
    '$exists',
    '$size',
  ]);
  return allowed.has(op);
}

export function isProjectionRepresentable(project: unknown): boolean {
  if (project === null || project === undefined) return true;
  if (typeof project !== 'object') return false;
  const doc = project as Document;
  return Object.values(doc).every((v) => v === 0 || v === 1);
}

export function isSortRepresentable(sort: unknown): boolean {
  if (sort === null || sort === undefined) return true;
  if (typeof sort !== 'object') return false;
  const doc = sort as Document;
  return Object.values(doc).every((v) => v === 1 || v === -1);
}
