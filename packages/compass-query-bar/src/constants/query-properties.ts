import type { Document } from 'mongodb';

// these state properties make up a "query"
const QUERY_PROPERTIES = [
  'filter',
  'project',
  'collation',
  'sort',
  'skip',
  'limit',
  'maxTimeMS',
] as const;

export type QueryProperty = typeof QUERY_PROPERTIES[number];

export type BaseQuery = Partial<{
  filter: Document;
  project: Document;
  collation: Document;
  sort: Document;
  skip: number;
  limit: number;
  maxTimeMS: number;
}>;

export default QUERY_PROPERTIES;
export { QUERY_PROPERTIES };
