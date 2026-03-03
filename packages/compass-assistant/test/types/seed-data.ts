/**
 * Types for seed data used in tool call evaluations.
 *
 * Phase 1: Used as prompt context only (schema + sample docs derived in-memory).
 * Phase 2: Loaded into a local MongoDB via compass-test-server for tool execution.
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
