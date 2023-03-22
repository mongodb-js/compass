import { validate } from 'mongodb-query-parser';

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
  filter: validate('filter'),
  project: validate('project'),
  collation: validate('collation'),
  sort: validate('sort'),
  skip: validate('skip'),
  limit: validate('limit'),
  maxTimeMS: validate('maxTimeMS'),
} as const;

export { DEFAULT_FIELD_VALUES, DEFAULT_QUERY_VALUES };
