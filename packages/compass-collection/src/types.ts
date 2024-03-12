export enum CollectionSubtabs {
  Documents = 'Documents',
  Aggregations = 'Aggregations',
  Schema = 'Schema',
  Indexes = 'Indexes',
  Validation = 'Validation',
}

export type CollectionSubtab = keyof typeof CollectionSubtabs;
