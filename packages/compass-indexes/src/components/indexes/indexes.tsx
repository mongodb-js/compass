import React, { useState } from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';
import { withPreferences } from 'compass-preferences-model';

import {
  sortIndexes,
  dropFailedIndex,
  hideIndex,
  unhideIndex,
  refreshIndexes,
} from '../../modules/regular-indexes';
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/regular-indexes';

import type { IndexView } from '../indexes-toolbar/indexes-toolbar';
import { IndexesToolbar } from '../indexes-toolbar/indexes-toolbar';
import { RegularIndexesTable } from '../regular-indexes-table/regular-indexes-table';
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
  indexes: IndexDefinition[];
  isWritable: boolean;
  isReadonlyView: boolean;
  description?: string;
  error: string | null;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  serverVersion: string;
  sortIndexes: (name: SortColumn, direction: SortDirection) => void;
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
  isWritable,
  isReadonlyView,
  description,
  error,
  localAppRegistry,
  isRefreshing,
  serverVersion,
  sortIndexes,
  refreshIndexes,
  dropFailedIndex,
  onHideIndex,
  onUnhideIndex,
  readOnly, // preferences readOnly.
  isAtlasSearchSupported,
}) => {
  const [currentIndexesView, setCurrentIndexesView] =
    useState<IndexView>('regular-indexes');

  const deleteIndex = (index: IndexDefinition) => {
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
        errorMessage={error}
        localAppRegistry={localAppRegistry}
        isRefreshing={isRefreshing}
        writeStateDescription={description}
        hasTooManyIndexes={indexes.length > IDEAL_NUMBER_OF_MAX_INDEXES}
        isAtlasSearchSupported={isAtlasSearchSupported}
        onRefreshIndexes={refreshIndexes}
        onChangeIndexView={setCurrentIndexesView}
      />
      {!isReadonlyView &&
        !error &&
        currentIndexesView === 'regular-indexes' && (
          <RegularIndexesTable
            indexes={indexes}
            serverVersion={serverVersion}
            canModifyIndex={isWritable && !readOnly}
            onSortTable={sortIndexes}
            onDeleteIndex={deleteIndex}
            onHideIndex={onHideIndex}
            onUnhideIndex={onUnhideIndex}
          />
        )}

      {!isReadonlyView && !error && currentIndexesView === 'search-indexes' && (
        <p style={{ textAlign: 'center' }}>In Progress feature</p>
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
  regularIndexes: { indexes, isRefreshing, error },
  searchIndexes: { status },
}: RootState) => ({
  indexes,
  isWritable,
  isReadonlyView,
  description,
  error,
  localAppRegistry: (appRegistry as any).localAppRegistry,
  isRefreshing,
  serverVersion,
  isAtlasSearchSupported: status !== SearchIndexesStatuses.NOT_AVAILABLE,
});

const mapDispatch = {
  sortIndexes,
  refreshIndexes,
  dropFailedIndex,
  onHideIndex: hideIndex,
  onUnhideIndex: unhideIndex,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(Indexes, ['readOnly'], React));
