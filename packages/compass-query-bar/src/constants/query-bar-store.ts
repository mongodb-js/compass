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

// TODO: Make this a different default export of query-parser.
type SingleArgumentValidate = (input: string) => any;

/**
 * Default values as will be returned from query parser during validation
 */
const DEFAULT_QUERY_VALUES = {
  filter: (validate as SingleArgumentValidate)('filter'),
  project: (validate as SingleArgumentValidate)('project'),
  collation: (validate as SingleArgumentValidate)('collation'),
  sort: (validate as SingleArgumentValidate)('sort'),
  skip: (validate as SingleArgumentValidate)('skip'),
  limit: (validate as SingleArgumentValidate)('limit'),
  maxTimeMS: (validate as SingleArgumentValidate)('maxTimeMS'),
} as const;

export { DEFAULT_FIELD_VALUES, DEFAULT_QUERY_VALUES };
