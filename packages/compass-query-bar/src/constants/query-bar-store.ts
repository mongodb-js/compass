import {
  DEFAULT_FILTER,
  DEFAULT_SORT,
  DEFAULT_LIMIT,
  DEFAULT_SKIP,
  DEFAULT_PROJECT,
  DEFAULT_COLLATION,
  DEFAULT_MAX_TIME_MS,
} from 'mongodb-query-parser';

/**
 * Default values for the query bar form inputs
 */
const DEFAULT_FIELD_VALUES = {
  filter: undefined,
  project: undefined,
  collation: undefined,
  sort: undefined,
  skip: undefined,
  limit: undefined,
  maxTimeMS: undefined,
} as const;

/**
 * Default values as will be returned from query parser during validation
 */
const DEFAULT_QUERY_VALUES = {
  filter: DEFAULT_FILTER,
  project: DEFAULT_PROJECT,
  collation: DEFAULT_COLLATION,
  sort: DEFAULT_SORT,
  skip: DEFAULT_SKIP,
  limit: DEFAULT_LIMIT,
  maxTimeMS: DEFAULT_MAX_TIME_MS,
} as const;

export { DEFAULT_FIELD_VALUES, DEFAULT_QUERY_VALUES };
