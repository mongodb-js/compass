import { parseFilter, toJSString } from 'mongodb-query-parser';

/**
 * The visual query builder keeps its own rows and compiles them into a query.
 * Everything in this module is pure so that the compilation rules can be
 * tested without rendering the panel.
 */

export type ConditionOperator =
  | 'eq'
  | 'ne'
  | 'gt'
  | 'gte'
  | 'lt'
  | 'lte'
  | 'in'
  | 'nin'
  | 'regex'
  | 'exists'
  | 'notExists';

export const CONDITION_OPERATORS: {
  value: ConditionOperator;
  label: string;
  /** Operators that match on the field itself rather than a value. */
  valueless?: boolean;
}[] = [
  { value: 'eq', label: '=' },
  { value: 'ne', label: '!=' },
  { value: 'gt', label: '>' },
  { value: 'gte', label: '>=' },
  { value: 'lt', label: '<' },
  { value: 'lte', label: '<=' },
  { value: 'in', label: 'in' },
  { value: 'nin', label: 'not in' },
  { value: 'regex', label: 'matches' },
  { value: 'exists', label: 'exists', valueless: true },
  { value: 'notExists', label: 'does not exist', valueless: true },
];

export function isValuelessOperator(operator: ConditionOperator): boolean {
  return operator === 'exists' || operator === 'notExists';
}

export type ConditionRow = {
  id: string;
  field: string;
  operator: ConditionOperator;
  /** Shell syntax, the same language the query bar uses. */
  valueText: string;
  enabled: boolean;
};

export type ProjectionRow = {
  id: string;
  field: string;
  mode: 'include' | 'exclude';
  enabled: boolean;
};

export type SortRow = {
  id: string;
  field: string;
  direction: 'asc' | 'desc';
  enabled: boolean;
};

export type BuilderState = {
  match: 'and' | 'or';
  conditions: ConditionRow[];
  projections: ProjectionRow[];
  sorts: SortRow[];
  /** Section level toggles, mirroring the checkbox on each section header. */
  queryEnabled: boolean;
  projectionEnabled: boolean;
  sortEnabled: boolean;
  skip: string;
  limit: string;
};

export const EMPTY_BUILDER_STATE: BuilderState = {
  match: 'and',
  conditions: [],
  projections: [],
  sorts: [],
  queryEnabled: true,
  projectionEnabled: true,
  sortEnabled: true,
  skip: '',
  limit: '',
};

let idCounter = 0;
export function nextRowId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${idCounter}`;
}

/**
 * Renders a value the way the query bar would, so that a value dropped in from
 * a document reads the same as one typed by hand.
 */
export function valueToText(value: unknown): string {
  if (value === undefined) {
    return '';
  }
  const asQuery = toJSString({ v: value }) ?? '';
  // toJSString always produces a pretty printed document; take what is between
  // the field name and the closing brace.
  const match = /v:\s*([\s\S]*?)\s*\}\s*$/.exec(asQuery);
  return match ? match[1] : String(value);
}

export type ParsedValue =
  | { ok: true; value: unknown }
  | { ok: false; error: string };

/**
 * Parses one value written in shell syntax by wrapping it in a document and
 * handing it to the same parser the query bar uses.
 */
export function parseValueText(text: string): ParsedValue {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { ok: false, error: 'Value is empty' };
  }
  try {
    const parsed = parseFilter(`{"__value": ${trimmed}}`) as Record<
      string,
      unknown
    >;
    if (!parsed || !('__value' in parsed)) {
      return { ok: false, error: 'Value could not be read' };
    }
    return { ok: true, value: parsed.__value };
  } catch (err) {
    return { ok: false, error: (err as Error).message };
  }
}

function conditionToFilterFragment(
  row: ConditionRow
): { field: string; value: unknown } | { error: string } {
  if (row.operator === 'exists') {
    return { field: row.field, value: { $exists: true } };
  }
  if (row.operator === 'notExists') {
    return { field: row.field, value: { $exists: false } };
  }

  const parsed = parseValueText(row.valueText);
  if (!parsed.ok) {
    return { error: `${row.field}: ${parsed.error}` };
  }

  switch (row.operator) {
    case 'eq':
      return { field: row.field, value: parsed.value };
    case 'in':
    case 'nin': {
      // `in` needs a list. A single value is accepted and wrapped, so that
      // switching operator on an existing row does not immediately break it.
      const list = Array.isArray(parsed.value) ? parsed.value : [parsed.value];
      return { field: row.field, value: { [`$${row.operator}`]: list } };
    }
    case 'regex':
      return {
        field: row.field,
        value:
          parsed.value instanceof RegExp
            ? parsed.value
            : { $regex: parsed.value },
      };
    default:
      return {
        field: row.field,
        value: { [`$${row.operator}`]: parsed.value },
      };
  }
}

export type CompiledQuery = {
  filter: Record<string, unknown>;
  project: Record<string, number> | null;
  sort: Record<string, number> | null;
  skip: number | null;
  limit: number | null;
  /** One message per row that could not be compiled. */
  errors: string[];
};

function compileConditions(state: BuilderState): {
  filter: Record<string, unknown>;
  errors: string[];
} {
  const errors: string[] = [];
  const rows = state.conditions.filter((row) => row.enabled && row.field);
  const fragments: { field: string; value: unknown }[] = [];

  for (const row of rows) {
    const fragment = conditionToFilterFragment(row);
    if ('error' in fragment) {
      errors.push(fragment.error);
      continue;
    }
    fragments.push(fragment);
  }

  if (fragments.length === 0) {
    return { filter: {}, errors };
  }

  if (state.match === 'or') {
    return {
      filter: {
        $or: fragments.map(({ field, value }) => ({ [field]: value })),
      },
      errors,
    };
  }

  // Matching all: fold into one document where possible, which is the shape a
  // person would write by hand. Repeated fields cannot be folded, so those fall
  // back to an explicit $and.
  const seen = new Set<string>();
  const hasRepeatedField = fragments.some(({ field }) => {
    if (seen.has(field)) {
      return true;
    }
    seen.add(field);
    return false;
  });

  if (hasRepeatedField) {
    return {
      filter: {
        $and: fragments.map(({ field, value }) => ({ [field]: value })),
      },
      errors,
    };
  }

  const filter: Record<string, unknown> = Object.create(null) as Record<
    string,
    unknown
  >;
  for (const { field, value } of fragments) {
    filter[field] = value;
  }
  return { filter, errors };
}

function compileCount(
  text: string,
  label: string
): {
  value: number | null;
  error?: string;
} {
  const trimmed = text.trim();
  if (trimmed === '') {
    return { value: null };
  }
  const parsed = Number(trimmed);
  if (!Number.isInteger(parsed) || parsed < 0) {
    return { value: null, error: `${label} must be a whole number` };
  }
  return { value: parsed };
}

export function compileBuilderState(state: BuilderState): CompiledQuery {
  const { filter, errors } = state.queryEnabled
    ? compileConditions(state)
    : { filter: {}, errors: [] };

  const projectionRows = state.projectionEnabled
    ? state.projections.filter((row) => row.enabled && row.field)
    : [];
  const sortRows = state.sortEnabled
    ? state.sorts.filter((row) => row.enabled && row.field)
    : [];

  const project = projectionRows.length
    ? Object.fromEntries(
        projectionRows.map((row) => [row.field, row.mode === 'include' ? 1 : 0])
      )
    : null;

  const sort = sortRows.length
    ? Object.fromEntries(
        sortRows.map((row) => [row.field, row.direction === 'asc' ? 1 : -1])
      )
    : null;

  const skip = compileCount(state.skip, 'Skip');
  const limit = compileCount(state.limit, 'Limit');
  const allErrors = [...errors];
  if (skip.error) {
    allErrors.push(skip.error);
  }
  if (limit.error) {
    allErrors.push(limit.error);
  }

  return {
    filter,
    project,
    sort,
    skip: skip.value,
    limit: limit.value,
    errors: allErrors,
  };
}

/** The compiled query rendered the way the query bar shows it. */
export function compiledQueryToText(compiled: CompiledQuery): {
  filter: string;
  project: string;
  sort: string;
} {
  return {
    filter: toJSString(compiled.filter) ?? '{}',
    project: compiled.project ? toJSString(compiled.project) ?? '' : '',
    sort: compiled.sort ? toJSString(compiled.sort) ?? '' : '',
  };
}

/**
 * The query to hand to the query bar for a compiled builder state.
 *
 * Every property is always present. A property left out of the query is not
 * cleared when the query is applied, it keeps whatever was applied before, so
 * removing the last projection row would otherwise leave the old projection
 * in effect. `undefined` is what clears a property.
 */
export function compiledQueryToAppliedQuery(compiled: CompiledQuery): {
  filter: Record<string, unknown>;
  project: Record<string, number> | undefined;
  sort: Record<string, number> | undefined;
  skip: number | undefined;
  limit: number | undefined;
} {
  return {
    filter: compiled.filter,
    project: compiled.project ?? undefined,
    sort: compiled.sort ?? undefined,
    skip: compiled.skip ?? undefined,
    limit: compiled.limit ?? undefined,
  };
}
