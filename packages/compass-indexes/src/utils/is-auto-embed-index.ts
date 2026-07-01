import type { Document } from 'mongodb';
import type { SearchIndex } from 'mongodb-data-service';

function definitionHasAutoEmbedField(
  definition: Document | undefined
): boolean {
  const fields = definition?.fields;
  if (!Array.isArray(fields)) {
    return false;
  }
  return fields.some(
    (field) =>
      field !== null &&
      typeof field === 'object' &&
      (field as { type?: unknown }).type === 'autoEmbed'
  );
}

/**
 * Returns true when the search index definition includes at least one field
 * of type `autoEmbed` (Atlas automated embedding for vector search).
 */
export function isAutoEmbedIndex(
  index: Pick<SearchIndex, 'latestDefinition'>
): boolean {
  return definitionHasAutoEmbedField(index.latestDefinition);
}
