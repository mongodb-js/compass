export type SearchIndex = {
  id: string;
  name: string;
  status: 'BUILDING' | 'FAILED' | 'PENDING' | 'READY' | 'STALE';
  queryable: boolean;
  latestDefinition: Document;
};
