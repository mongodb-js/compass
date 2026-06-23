import { useMemo } from 'react';
import type { JSONSchema7 } from 'json-schema';
import { getSchema } from '@mongodb-js/search-index-schema';
import type { FeatureFlag } from '@mongodb-js/search-index-schema';
import { usePreferences } from 'compass-preferences-model/provider';
import type { SearchIndexType } from '../modules/indexes-drawer';

export function useJsonSchema(indexType: SearchIndexType): JSONSchema7 {
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
          enableSortedSearchIndexes
            ? ('sortedIndex' satisfies FeatureFlag)
            : undefined,
          enableAutoEmbeddingPrivatePreview
            ? ('autoEmbeddingPrivatePreview' satisfies FeatureFlag)
            : undefined,
          enableAutoEmbeddingPublicPreview
            ? ('autoEmbeddingPublicPreview' satisfies FeatureFlag)
            : undefined,
        ].filter((f): f is FeatureFlag => Boolean(f))
      ) as JSONSchema7,
    [
      indexType,
      enableSortedSearchIndexes,
      enableAutoEmbeddingPrivatePreview,
      enableAutoEmbeddingPublicPreview,
    ]
  );
}
