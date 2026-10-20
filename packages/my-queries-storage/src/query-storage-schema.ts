import { z } from '@mongodb-js/compass-user-data';
import { parse, ParseMode, toJSString } from '@mongodb-js/shell-bson-parser';

const queryProps = {
  filter: z.string().optional(),
  project: z.string().optional(),
  collation: z.string().optional(),
  sort: z.string().optional(),
  skip: z.number().optional(),
  limit: z.number().optional(),
  update: z.string().optional(),
  hint: z.string().optional(),
};

const commonMetadata = {
  _id: z.string().uuid(),
  _lastExecuted: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
  _ns: z.string(),
  _host: z.string().optional(),
};

export const RecentQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
});

export const FavoriteQuerySchema = z.object({
  ...queryProps,
  ...commonMetadata,
  _name: z.string().nonempty(),
  _dateModified: z
    .union([z.coerce.date(), z.number()])
    .optional()
    .transform((x) => (x !== undefined ? new Date(x) : x)),
  _dateSaved: z
    .union([z.coerce.date(), z.number()])
    .transform((x) => new Date(x)),
});

export type RecentQuery = z.output<typeof RecentQuerySchema>;

export type FavoriteQuery = z.output<typeof FavoriteQuerySchema>;

function legacyValueToQueryString(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  if (
    !value ||
    (typeof value === 'object' && Object.keys(value).length === 0)
  ) {
    return undefined;
  }
  return toJSString(value);
}

function isQueryString(value: string): boolean {
  try {
    // Bare identifiers like `a_1` parse to an empty string.
    return parse(value, { mode: ParseMode.Loose }) !== '';
  } catch {
    return false;
  }
}

// Legacy hints can be an index name, which has to be quoted to be a query string.
function legacyHintToQueryString(value: unknown): string | undefined {
  if (typeof value === 'string' && !isQueryString(value)) {
    return toJSString(value);
  }
  return legacyValueToQueryString(value);
}

/**
 * Queries used to be stored as their parsed values, these are converted to
 * query strings when read. Compass versions that predate the string format
 * load these strings as string literals, so downgrading breaks saved queries.
 */
export function legacyQueryToQueryStrings(query: unknown): unknown {
  if (!query || typeof query !== 'object') {
    return query;
  }
  const converted: Record<string, unknown> = { __proto__: null, ...query };
  for (const key of [
    'filter',
    'project',
    'collation',
    'sort',
    'update',
  ] as const) {
    if (key in converted) {
      converted[key] = legacyValueToQueryString(converted[key]);
    }
  }
  if ('hint' in converted) {
    converted.hint = legacyHintToQueryString(converted.hint);
  }
  return converted;
}
