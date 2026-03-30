import type { MockDataSchemaToolOutput, RawSchema } from './schema';

// Based on token output limits; provides safe buffer.
export const FIELDS_PER_CHUNK = 30;
// Supports up to 300 total fields
export const MAX_CHUNKS = 10;

/**
 * Splits a schema into smaller chunks for processing.
 */
export function splitSchemaIntoChunks(
  rawSchema: RawSchema,
  fieldsPerChunk: number = FIELDS_PER_CHUNK
): RawSchema[] {
  if (fieldsPerChunk <= 0) {
    throw new Error('fieldsPerChunk must be a positive integer');
  }

  const entries = Object.entries(rawSchema);

  if (entries.length === 0) {
    return [];
  }

  return Array.from(
    { length: Math.ceil(entries.length / fieldsPerChunk) },
    (_, i) =>
      Object.fromEntries(
        entries.slice(i * fieldsPerChunk, (i + 1) * fieldsPerChunk)
      )
  );
}

/**
 * Merges multiple chunk responses into a single response.
 */
export function mergeChunkResponses(
  chunkResponses: MockDataSchemaToolOutput[]
): MockDataSchemaToolOutput {
  if (chunkResponses.length === 0) {
    return { fields: [] };
  }

  return { fields: chunkResponses.flatMap((response) => response.fields) };
}

/**
 * Validates schema size is within processing limits.
 * Throws if schema exceeds maximum supported fields.
 */
export function validateSchemaSize(rawSchema: RawSchema): void {
  const fieldCount = Object.keys(rawSchema).length;
  const maxFields = FIELDS_PER_CHUNK * MAX_CHUNKS;

  if (fieldCount > maxFields) {
    throw new Error(
      `Schema too large: ${fieldCount} fields exceeds maximum of ${maxFields} fields`
    );
  }
}

/**
 * Determines if schema needs to be processed in chunks.
 */
export function needsBatching(rawSchema: RawSchema): boolean {
  return Object.keys(rawSchema).length > FIELDS_PER_CHUNK;
}
