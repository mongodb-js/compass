import type { TranslateFn } from '@mongodb-js/compass-components';

export function getSearchIndexLabels(t: TranslateFn, isVectorSearch: boolean) {
  return isVectorSearch
    ? {
        label: t('indexes.searchIndexLabel.vector', 'Vector Search Index'),
        lowerCase: t(
          'indexes.searchIndexLabel.vectorLowerCase',
          'vector search index'
        ),
        plural: t(
          'indexes.searchIndexLabel.vectorPlural',
          'Vector Search Indexes'
        ),
      }
    : {
        label: t('indexes.searchIndexLabel.search', 'Search Index'),
        lowerCase: t(
          'indexes.searchIndexLabel.searchLowerCase',
          'search index'
        ),
        plural: t('indexes.searchIndexLabel.searchPlural', 'Search Indexes'),
      };
}
