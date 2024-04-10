import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import {
  Banner,
  Body,
  Link,
  WorkspaceContainer,
  css,
  spacing,
} from '@mongodb-js/compass-components';

import IndexesToolbar from '../indexes-toolbar/indexes-toolbar';
import RegularIndexesTable from '../regular-indexes-table/regular-indexes-table';
import SearchIndexesTable from '../search-indexes-table/search-indexes-table';
import { refreshRegularIndexes } from '../../modules/regular-indexes';
import { refreshSearchIndexes } from '../../modules/search-indexes';
import type { State as RegularIndexesState } from '../../modules/regular-indexes';
import type { State as SearchIndexesState } from '../../modules/search-indexes';
import { SearchIndexesStatuses } from '../../modules/search-indexes';
import type { SearchIndexesStatus } from '../../modules/search-indexes';
import type { RootState } from '../../modules';
import {
  CreateSearchIndexModal,
  UpdateSearchIndexModal,
} from '../search-indexes-modals';
import type { IndexView } from '../../modules/index-view';
import { usePreference } from 'compass-preferences-model/provider';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getAtlasSearchIndexesLink } from '../../utils/atlas-search-indexes-link';

// This constant is used as a trigger to show an insight whenever number of
// indexes in a collection is more than what is specified here.
const IDEAL_NUMBER_OF_MAX_INDEXES = 10;

const containerStyles = css({
  paddingTop: spacing[3],
  paddingLeft: spacing[3],
  paddingRight: spacing[3],
  // No padding bottom so that the table can scroll visibly to the bottom
  paddingBottom: 0,
  gap: spacing[3],
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: '100%',
  flexGrow: 1,
});

const linkTitle = 'Atlas Search.';
const AtlasIndexesBanner = () => {
  const { atlasMetadata } = useConnectionInfo();
  return (
    <Banner variant="info">
      <Body weight="medium">Looking for search indexes?</Body>
      These indexes can be created and viewed under{' '}
      {atlasMetadata ? (
        <Link href={getAtlasSearchIndexesLink(atlasMetadata)} hideExternalIcon>
          {linkTitle}
        </Link>
      ) : (
        linkTitle
      )}
    </Banner>
  );
};

type IndexesProps = {
  isReadonlyView?: boolean;
  regularIndexes: Pick<
    RegularIndexesState,
    'indexes' | 'error' | 'isRefreshing'
  >;
  searchIndexes: Pick<SearchIndexesState, 'indexes' | 'error' | 'status'>;
  currentIndexesView: IndexView;
  refreshRegularIndexes: () => void;
  refreshSearchIndexes: () => void;
};

function isRefreshingStatus(status: SearchIndexesStatus) {
  return (
    status === SearchIndexesStatuses.FETCHING ||
    status === SearchIndexesStatuses.REFRESHING
  );
}

export function Indexes({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView,
  refreshRegularIndexes,
  refreshSearchIndexes,
}: IndexesProps) {
  const errorMessage =
    currentIndexesView === 'regular-indexes'
      ? regularIndexes.error
      : searchIndexes.error;

  const hasTooManyIndexes =
    currentIndexesView === 'regular-indexes' &&
    regularIndexes.indexes.length > IDEAL_NUMBER_OF_MAX_INDEXES;

  const isRefreshing =
    currentIndexesView === 'regular-indexes'
      ? regularIndexes.isRefreshing === true
      : isRefreshingStatus(searchIndexes.status);

  const onRefreshIndexes =
    currentIndexesView === 'regular-indexes'
      ? refreshRegularIndexes
      : refreshSearchIndexes;

  const loadIndexes = useCallback(() => {
    if (currentIndexesView === 'regular-indexes') {
      refreshRegularIndexes();
    } else {
      refreshSearchIndexes();
    }
  }, [currentIndexesView, refreshRegularIndexes, refreshSearchIndexes]);

  useEffect(() => {
    loadIndexes();
  }, [loadIndexes]);

  const enableAtlasSearchIndexes = usePreference('enableAtlasSearchIndexes');

  return (
    <div className={containerStyles}>
      <WorkspaceContainer
        toolbar={
          <IndexesToolbar
            errorMessage={errorMessage || null}
            hasTooManyIndexes={hasTooManyIndexes}
            isRefreshing={isRefreshing}
            onRefreshIndexes={onRefreshIndexes}
          />
        }
      >
        {!isReadonlyView && !enableAtlasSearchIndexes && <AtlasIndexesBanner />}
        {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
          <RegularIndexesTable />
        )}
        {!isReadonlyView && currentIndexesView === 'search-indexes' && (
          <SearchIndexesTable />
        )}
      </WorkspaceContainer>
      <CreateSearchIndexModal />
      <UpdateSearchIndexModal />
    </div>
  );
}

const mapState = ({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  indexView,
}: RootState) => ({
  isReadonlyView,
  regularIndexes,
  searchIndexes,
  currentIndexesView: indexView,
});

const mapDispatch = {
  refreshRegularIndexes,
  refreshSearchIndexes,
};

export default connect(mapState, mapDispatch)(Indexes);
