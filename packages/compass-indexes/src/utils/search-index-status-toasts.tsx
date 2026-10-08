import React from 'react';
import { buildAtlasSearchLink } from '@mongodb-js/atlas-service/provider';
import type { SearchIndex } from 'mongodb-data-service';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { Link, openToast } from '@mongodb-js/compass-components';
import type { TranslateFn } from '@mongodb-js/compass-components';
import { translateToEnglish } from './get-translate';

/**
 * Detects search indexes that transitioned statuses and shows appropriate toast notifications.
 */
export function showSearchIndexStatusChangeToasts(
  previousIndexes: SearchIndex[],
  newIndexes: SearchIndex[],
  atlasMetadata: AtlasClusterMetadata | undefined,
  namespace: string,
  onStatusDetailsLinkClick: (index: SearchIndex) => void,
  t: TranslateFn = translateToEnglish
): void {
  const previousIndexesMap = new Map(
    previousIndexes.map((index) => [index.name, index])
  );

  for (const index of newIndexes) {
    const previousIndex = previousIndexesMap.get(index.name);
    const isVectorSearch = index.type === 'vectorSearch';
    const indexTypeLabel = isVectorSearch
      ? t('indexes.statusToast.vectorSearchIndex', 'Vector search index')
      : t('indexes.statusToast.searchIndex', 'Search index');

    if (index.status === 'BUILDING') {
      if (!previousIndex) {
        openToast(`search-index-building-${index.name}`, {
          title: t(
            'indexes.statusToast.buildInProgress',
            'Index build in progress'
          ),
          description: t(
            'indexes.statusToast.buildingNonQueryable',
            '{indexType} {name} is building and is non-queryable.',
            { indexType: indexTypeLabel, name: index.name }
          ),
          dismissible: true,
          timeout: 5000,
          variant: 'progress',
        });
      } else if (
        previousIndex.status === 'READY' ||
        previousIndex.status === 'FAILED'
      ) {
        openToast(`search-index-rebuilding-${index.name}`, {
          title: t(
            'indexes.statusToast.rebuilding',
            '{indexType} is rebuilding',
            { indexType: indexTypeLabel }
          ),
          description: previousIndex.queryable
            ? t(
                'indexes.statusToast.rebuildingQueryable',
                '{indexType} {name} is rebuilding and is queryable.',
                { indexType: indexTypeLabel, name: index.name }
              )
            : t(
                'indexes.statusToast.rebuildingNonQueryable',
                '{indexType} {name} is rebuilding and is non-queryable.',
                { indexType: indexTypeLabel, name: index.name }
              ),
          dismissible: true,
          timeout: 5000,
          variant: 'progress',
        });
      }
    } else if (
      index.status === 'FAILED' &&
      previousIndex?.status !== 'FAILED'
    ) {
      openToast(`search-index-build-failed-${index.name}`, {
        title: t(
          'indexes.statusToast.buildFailed',
          '{indexType} build failed',
          { indexType: indexTypeLabel }
        ),
        description: (
          <>
            {index.queryable
              ? t(
                  'indexes.statusToast.failedQueryable',
                  'The index build for {name} failed and is queryable.',
                  { name: index.name }
                )
              : t(
                  'indexes.statusToast.failedNonQueryable',
                  'The index build for {name} failed and is non-queryable.',
                  { name: index.name }
                )}{' '}
            {atlasMetadata ? (
              <Link
                href={buildAtlasSearchLink({
                  atlasMetadata,
                  namespace,
                  indexName: index.name,
                  view: 'StatusDetails',
                })}
                target="_blank"
                onClick={() => onStatusDetailsLinkClick(index)}
              >
                {t(
                  'indexes.statusToast.viewStatusDetails',
                  'View Status Details by Node'
                )}
              </Link>
            ) : null}
          </>
        ),
        dismissible: true,
        timeout: 0, // do not auto-dismiss
        variant: 'warning',
      });
    } else if (index.status === 'READY' && previousIndex?.status !== 'READY') {
      openToast(`search-index-build-success-${index.name}`, {
        title: t(
          'indexes.statusToast.buildComplete',
          '{indexType} build complete',
          { indexType: indexTypeLabel }
        ),
        description: isVectorSearch
          ? t(
              'indexes.statusToast.vectorSearchFinished',
              'Your vector search index {name} has finished building and is queryable.',
              { name: index.name }
            )
          : t(
              'indexes.statusToast.searchFinished',
              'Your search index {name} has finished building and is queryable.',
              { name: index.name }
            ),
        dismissible: true,
        timeout: 5000,
        variant: 'success',
      });
    }
  }
}
