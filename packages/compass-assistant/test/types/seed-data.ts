/**
 * Types for seed data used in tool call evaluations.
 */

export interface SeedCollectionIndex {
  key: Record<string, 1 | -1 | '2dsphere' | 'text'>;
  options?: Record<string, unknown>;
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
