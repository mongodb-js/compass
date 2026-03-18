import React from 'react';
import {
  css,
  spacing,
  Link,
  Banner,
  useDrawerActions,
} from '@mongodb-js/compass-components';
import {
  mapSearchStageOperatorToSearchIndexType,
  SearchStageOperator,
} from '../utils/stage';

const bannerStyles = css({
  flex: 'none',
  marginTop: spacing[200],
  marginLeft: spacing[200],
  marginRight: spacing[200],
  textAlign: 'left',
});

type SearchIndexDoesNotExistBannerProps = {
  searchStageOperator: SearchStageOperator;
  onViewIndexesClick?: () => void;
  onCreateSearchIndexClick?: (searchIndexType: string) => void;
};

export default function SearchIndexDoesNotExistBanner({
  searchStageOperator,
  onViewIndexesClick,
  onCreateSearchIndexClick,
}: SearchIndexDoesNotExistBannerProps) {
  const { openDrawer } = useDrawerActions();
  const searchIndexType =
    mapSearchStageOperatorToSearchIndexType(searchStageOperator);
  const message = `${
    searchIndexType === 'vectorSearch' ? 'Vector search' : 'Search'
  } index doesn't exist.`;

  return (
    <Banner variant="warning" title={message} className={bannerStyles}>
      {message}{' '}
      {onViewIndexesClick && onCreateSearchIndexClick && (
        <>
          <Link
            onClick={() => {
              openDrawer('compass-indexes-drawer');
              onViewIndexesClick();
            }}
          >
            View Search Indexes
          </Link>
          {' or '}
          <Link
            onClick={() => {
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
