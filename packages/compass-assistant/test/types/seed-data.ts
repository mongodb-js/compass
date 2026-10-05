import type { IndexDescription, IndexDirection } from 'mongodb';

/**
 * Types for seed data used in tool call evaluations.
 */

export interface SeedCollectionIndex {
  key: Record<string, IndexDirection>;
  options?: Omit<IndexDescription, 'key'>;
}

export interface SeedCollectionConfig {
  collectionName: string;
  documents: Record<string, unknown>[];
  indexes?: SeedCollectionIndex[];
}

export interface SeedDatabase {
  databaseName: string;
  collections: SeedCollectionConfig[];
}
