import React from 'react';
import {
  css,
  spacing,
  Link,
  Banner,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import { useTelemetry } from '@mongodb-js/compass-telemetry/provider';
import { mapSearchStageOperatorToSearchIndexType } from '../utils/stage';
import type { SearchStageOperator } from '../utils/stage';
import type { SearchIndexType } from '../modules/search-indexes';

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  textAlign: 'left',
});

type SearchIndexDoesNotExistBannerProps = {
  searchIndexName: string | null;
  searchStageOperator: SearchStageOperator;
  onViewIndexesClick?: () => void;
  onCreateSearchIndexClick?: (searchIndexType: SearchIndexType) => void;
};

export default function SearchIndexDoesNotExistBanner({
  searchIndexName,
  searchStageOperator,
  onViewIndexesClick,
  onCreateSearchIndexClick,
}: SearchIndexDoesNotExistBannerProps) {
  const { openDrawer } = useDrawerActions();
  const track = useTelemetry();
  const searchIndexType =
    mapSearchStageOperatorToSearchIndexType(searchStageOperator);
  const indexLabel =
    searchIndexType === 'vectorSearch' ? 'Vector search' : 'Search';
  const message = searchIndexName
    ? `${indexLabel} index '${searchIndexName}' doesn't exist.`
    : `${indexLabel} index doesn't exist.`;

  return (
    <Banner
      variant="warning"
      data-testid="search-index-does-not-exist-banner"
      title={message}
      className={bannerStyles}
    >
      {message}{' '}
      {onViewIndexesClick && onCreateSearchIndexClick && (
        <>
          <Link
            onClick={() => {
              track('Search Index View Indexes Link Clicked', {
                context: 'Search Index Does Not Exist Banner',
              });
              openDrawer('compass-indexes-drawer');
              onViewIndexesClick();
            }}
          >
            View Search Indexes
          </Link>
          {' or '}
          <Link
            onClick={() => {
              track('Search Index Create Link Clicked', {
                context: 'Search Index Does Not Exist Banner',
                index_type: searchIndexType,
              });
              openDrawer('compass-indexes-drawer');
              onCreateSearchIndexClick(searchIndexType);
            }}
          >
            Create a New Index
          </Link>
        </>
      )}
    </Banner>
  );
}
