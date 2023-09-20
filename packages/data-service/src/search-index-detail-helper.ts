import type { Document } from 'mongodb';

export type SearchIndexStatus =
  | 'BUILDING'
  | 'FAILED'
  | 'PENDING'
  | 'READY'
  | 'STALE'
  | 'DELETING';

export type SearchIndex = {
  id: string;
  name: string;
  status: SearchIndexStatus;
  queryable: boolean;
  latestDefinition: Document;
};
