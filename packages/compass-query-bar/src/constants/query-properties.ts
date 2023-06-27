import type { Document } from 'mongodb';

// these state properties make up a "query"
export const QUERY_PROPERTIES = [
  'filter',
  'project',
  'collation',
  'sort',
  'skip',
  'limit',
  'maxTimeMS',
] as const;

export type QueryProperty = typeof QUERY_PROPERTIES[number];

// How each query property is represented in the UI state.
type FormField<T> = {
  value: T;
  string: string;
  valid: boolean;
};

// All the possible form fields of a query
export type QueryFormFields = {
  filter: FormField<Document>;
  project: FormField<Document>;
  collation: FormField<Document>;
  sort: FormField<Document>;
  skip: FormField<number>;
  limit: FormField<number>;
  maxTimeMS: FormField<number>;
};

// The runnable query (its actually run and saved)
export type BaseQuery = Partial<{
  [key in keyof QueryFormFields]: QueryFormFields[key]['value'];
}>;
