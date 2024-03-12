export enum CollectionTabs {
  Documents = 'Documents',
  Aggregations = 'Aggregations',
  Schema = 'Schema',
  Indexes = 'Indexes',
  Validation = 'Validation',
}

export type CollectionTab = keyof typeof CollectionTabs;
