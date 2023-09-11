import React, { useState } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';
import { withPreferences } from 'compass-preferences-model';
import type { SearchIndex } from 'mongodb-data-service';

import {
  sortRegularIndexes,
  dropFailedIndex,
  hideIndex,
  unhideIndex,
  refreshRegularIndexes,
} from '../../modules/regular-indexes';
import type {
  RegularIndex,
  RegularSortColumn,
  SortDirection,
} from '../../modules/regular-indexes';

import { sortSearchIndexes } from '../../modules/search-indexes';

import type { SearchSortColumn } from '../../modules/search-indexes';

import type { IndexView } from '../indexes-toolbar/indexes-toolbar';
import { IndexesToolbar } from '../indexes-toolbar/indexes-toolbar';
import { RegularIndexesTable } from '../regular-indexes-table/regular-indexes-table';
import { SearchIndexesTable } from '../search-indexes-table/search-indexes-table';
import type { RootState } from '../../modules';
import { SearchIndexesStatuses } from '../../modules/search-indexes';

const containerStyles = css({
  margin: spacing[3],
  marginTop: 0,
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
});

type IndexesProps = {
  indexes: RegularIndex[];
  searchIndexes: SearchIndex[];
  isWritable: boolean;
  isReadonlyView: boolean;
  description?: string;
  regularError: string | null;
  searchError: string | null;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  serverVersion: string;
  sortRegularIndexes: (
    name: RegularSortColumn,
    direction: SortDirection
  ) => void;
  sortSearchIndexes: (name: SearchSortColumn, direction: SortDirection) => void;
  refreshIndexes: () => void;
  dropFailedIndex: (id: string) => void;
  onHideIndex: (name: string) => void;
  onUnhideIndex: (name: string) => void;
  readOnly?: boolean;
  isAtlasSearchSupported: boolean;
};

// This constant is used as a trigger to show an insight whenever number of
// indexes in a collection is more than what is specified here.
const IDEAL_NUMBER_OF_MAX_INDEXES = 10;

export const Indexes: React.FunctionComponent<IndexesProps> = ({
  indexes,
  searchIndexes,
  isWritable,
  isReadonlyView,
  description,
  regularError,
  searchError,
  localAppRegistry,
  isRefreshing,
  serverVersion,
  sortRegularIndexes,
  sortSearchIndexes,
  refreshIndexes,
  dropFailedIndex,
  onHideIndex,
  onUnhideIndex,
  readOnly, // preferences readOnly.
  isAtlasSearchSupported,
}) => {
  const [currentIndexesView, setCurrentIndexesView] =
    useState<IndexView>('regular-indexes');

  const deleteIndex = (index: RegularIndex) => {
    if (index.extra.status === 'failed') {
      return dropFailedIndex(String(index.extra.id));
    }

    return localAppRegistry.emit('toggle-drop-index-modal', true, index.name);
  };

  return (
    <div className={containerStyles}>
      <IndexesToolbar
        isWritable={isWritable}
        isReadonlyView={isReadonlyView}
        readOnly={readOnly}
        errorMessage={regularError || searchError}
        localAppRegistry={localAppRegistry}
        isRefreshing={isRefreshing}
        writeStateDescription={description}
        hasTooManyIndexes={indexes.length > IDEAL_NUMBER_OF_MAX_INDEXES}
        isAtlasSearchSupported={isAtlasSearchSupported}
        onRefreshIndexes={refreshIndexes}
        onChangeIndexView={setCurrentIndexesView}
      />
      {!isReadonlyView &&
        !regularError &&
        currentIndexesView === 'regular-indexes' && (
          <RegularIndexesTable
            indexes={indexes}
            serverVersion={serverVersion}
            canModifyIndex={isWritable && !readOnly}
            onSortTable={sortRegularIndexes}
            onDeleteIndex={deleteIndex}
            onHideIndex={onHideIndex}
            onUnhideIndex={onUnhideIndex}
          />
        )}

      {!isReadonlyView &&
        !searchError &&
        currentIndexesView === 'search-indexes' && (
          <SearchIndexesTable
            indexes={searchIndexes}
            canModifyIndex={isWritable && !readOnly}
            onSortTable={sortSearchIndexes}
          />
        )}
    </div>
  );
};

const mapState = ({
  isWritable,
  isReadonlyView,
  description,
  serverVersion,
  appRegistry,
  regularIndexes,
  searchIndexes,
}: RootState) => ({
  indexes: regularIndexes.indexes,
  searchIndexes: searchIndexes.searchIndexes,
  isWritable,
  isReadonlyView,
  description,
  regularError: regularIndexes.error,
  searchError: searchIndexes.error,
  localAppRegistry: (appRegistry as any).localAppRegistry,
  isRefreshing:
    regularIndexes.isRefreshing || searchIndexes.status === 'REFRESHING',
  serverVersion,
  isAtlasSearchSupported:
    searchIndexes.status !== SearchIndexesStatuses.NOT_AVAILABLE,
});

const mapDispatch = {
  sortRegularIndexes,
  sortSearchIndexes,
  refreshRegularIndexes,
  dropFailedIndex,
  onHideIndex: hideIndex,
  onUnhideIndex: unhideIndex,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(Indexes, ['readOnly'], React));
