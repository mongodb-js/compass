import React from 'react';
import type { SearchIndex } from 'mongodb-data-service';
import type { AtlasClusterMetadata } from '@mongodb-js/connection-info';
import { Link, openToast } from '@mongodb-js/compass-components';
import { getAtlasSearchIndexesLink } from './atlas-search-indexes-link';

/**
 * Detects search indexes that transitioned statuses and shows appropriate toast notifications.
 */
export function showIndexStatusChangeToasts(
  previousIndexes: SearchIndex[],
  newIndexes: SearchIndex[],
  atlasMetadata: AtlasClusterMetadata | undefined,
  namespace: string
): void {
  const previousIndexesMap = new Map(
    previousIndexes.map((index) => [index.name, index])
  );

  for (const index of newIndexes) {
    const previousIndex = previousIndexesMap.get(index.name);
    const indexTypeLabel =
      index.type === 'vectorSearch' ? 'Vector search index' : 'Search index';

    if (index.status === 'BUILDING') {
      if (!previousIndex) {
        openToast(`search-index-building-${index.name}`, {
          title: 'Index build in progress',
          description: `${indexTypeLabel} ${index.name} is building and is non-queryable.`,
          dismissible: true,
          timeout: 5000,
          variant: 'progress',
        });
      } else if (previousIndex.status !== 'BUILDING') {
        openToast(`search-index-rebuilding-${index.name}`, {
          title: `${indexTypeLabel} is rebuilding`,
          description: `${indexTypeLabel} ${index.name} is rebuilding and is ${
            previousIndex.queryable ? 'queryable' : 'non-queryable'
          }.`,
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
        title: `${indexTypeLabel} build failed`,
        description: (
          <>
            The index build for {index.name} failed and is{' '}
            {index.queryable ? 'queryable' : 'non-queryable'}.{' '}
            {atlasMetadata ? (
              <Link
                href={getAtlasSearchIndexesLink({
                  clusterName: atlasMetadata.clusterName,
                  namespace,
                  indexName: index.name,
                  view: 'StatusDetails',
                })}
                target="_blank"
              >
                View Status Details by Node
              </Link>
            ) : null}
          </>
        ),
        dismissible: true,
        timeout: 5000,
        variant: 'warning',
      });
    } else if (index.status === 'READY' && previousIndex?.status !== 'READY') {
      openToast(`search-index-build-success-${index.name}`, {
        title: `${indexTypeLabel} build complete`,
        description: `Your ${indexTypeLabel.toLowerCase()} ${
          index.name
        } has finished building and is queryable.`,
        dismissible: true,
        timeout: 5000,
        variant: 'success',
      });
    }
  }
}
