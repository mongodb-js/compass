import { useMemo } from 'react';
import type { JSONSchema7 } from 'json-schema';
import { getSchema } from '@mongodb-js/search-index-schema';
import type { FeatureFlag } from '@mongodb-js/search-index-schema';
import { usePreferences } from 'compass-preferences-model/provider';
import { SearchIndexType } from '../modules/indexes-drawer';

export function useJSONSchema(indexType: SearchIndexType): JSONSchema7 {
  const {
    enableAutoEmbeddingPublicPreview,
    enableAutoEmbeddingPrivatePreview,
    enableSortedSearchIndexes,
  } = usePreferences([
    'enableAutoEmbeddingPublicPreview',
    'enableAutoEmbeddingPrivatePreview',
    'enableSortedSearchIndexes',
  ]);

  return useMemo(
    () =>
      getSchema(
        indexType,
        [
          enableSortedSearchIndexes && 'sortedIndex',
          enableAutoEmbeddingPrivatePreview && 'autoEmbeddingPrivatePreview',
          enableAutoEmbeddingPublicPreview && 'autoEmbeddingPublicPreview',
        ].filter((f): f is FeatureFlag => f !== false)
      ) as JSONSchema7,
    [
      indexType,
      enableSortedSearchIndexes,
      enableAutoEmbeddingPrivatePreview,
      enableAutoEmbeddingPublicPreview,
    ]
  );
}
