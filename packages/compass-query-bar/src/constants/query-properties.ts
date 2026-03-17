import type { Document } from 'mongodb';

// these state properties make up a "query"
export const QUERY_PROPERTIES = [
  'filter',
  'project',
  'collation',
  'sort',
  'hint',
  'skip',
  'limit',
  'maxTimeMS',
] as const;

export type QueryProperty = (typeof QUERY_PROPERTIES)[number];

// How each query property is represented in the UI state.
export type FormField<T> = {
  value: T;
  string: string;
  valid: boolean;
};

// All the possible form fields of a query
export type QueryFormFields = {
  filter: FormField<Document>;
  project: FormField<Document | null>;
  collation: FormField<Document | null>;
  sort: FormField<Document | null>;
  hint: FormField<Document | string | null>;
  skip: FormField<number>;
  limit: FormField<number>;
  maxTimeMS: FormField<number>;
};

export type QueryFormFieldEntries = {
  [field in keyof QueryFormFields]: [field, QueryFormFields[field]];
}[keyof QueryFormFields][];

// The runnable query (its actually run and saved)
export type BaseQuery = Partial<{
  [key in keyof QueryFormFields]: QueryFormFields[key]['value'];
}>;
