/**
 * Default values for the query bar form inputs
 */
const DEFAULT_FIELD_VALUES = {
  filter: undefined,
  project: undefined,
  collation: undefined,
  sort: undefined,
  hint: undefined,
  skip: undefined,
  limit: undefined,
  maxTimeMS: undefined,
} as const;

/**
 * Default values as will be returned from query parser during validation
 */
const DEFAULT_QUERY_VALUES = {
  filter: {},
  project: null,
  collation: null,
  sort: null,
  hint: null,
  skip: 0,
  limit: 0,
  maxTimeMS: 60000,
} as const;

export { DEFAULT_FIELD_VALUES, DEFAULT_QUERY_VALUES };
