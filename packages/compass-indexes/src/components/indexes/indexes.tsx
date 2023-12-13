import React, { useCallback, useEffect } from 'react';
import { connect } from 'react-redux';
import { css, spacing } from '@mongodb-js/compass-components';

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
import type { CollectionTabPluginMetadata } from '@mongodb-js/compass-collection';

// This constant is used as a trigger to show an insight whenever number of
// indexes in a collection is more than what is specified here.
const IDEAL_NUMBER_OF_MAX_INDEXES = 10;

const contentStyles = css({
  display: 'flex',
  flex: 1,
  minHeight: 0,
});

const containerStyles = css({
  margin: spacing[3],
  marginTop: 0,
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
  minHeight: 0,
  width: '100%',
});

type IndexesProps = Pick<CollectionTabPluginMetadata, 'isActive'> & {
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
  isActive,
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
    if (isActive) {
      loadIndexes();
    }
  }, [isActive, loadIndexes]);

  if (!isActive) {
    return null;
  }

  return (
    <div className={contentStyles} data-testid="indexes-content">
      <div className={containerStyles}>
        <IndexesToolbar
          errorMessage={errorMessage || null}
          hasTooManyIndexes={hasTooManyIndexes}
          isRefreshing={isRefreshing}
          onRefreshIndexes={onRefreshIndexes}
        />
        {!isReadonlyView && currentIndexesView === 'regular-indexes' && (
          <RegularIndexesTable />
        )}
        {!isReadonlyView && currentIndexesView === 'search-indexes' && (
          <SearchIndexesTable />
        )}
        <CreateSearchIndexModal />
        <UpdateSearchIndexModal />
      </div>
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
