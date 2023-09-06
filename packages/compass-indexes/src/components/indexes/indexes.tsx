import React from 'react';
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

import { IndexesToolbar } from '../indexes-toolbar/indexes-toolbar';
import { IndexesTable } from '../indexes-table/indexes-table';
import type { RootState } from '../../modules';

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
}) => {
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
        isAtlasSearchSupported={true}
        onRefreshIndexes={refreshIndexes}
      />
      {!isReadonlyView && !error && (
        <IndexesTable
          indexes={indexes}
          serverVersion={serverVersion}
          canModifyIndex={isWritable && !readOnly}
          onSortTable={sortIndexes}
          onDeleteIndex={deleteIndex}
          onHideIndex={onHideIndex}
          onUnhideIndex={onUnhideIndex}
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
  regularIndexes: { indexes, isRefreshing, error },
}: RootState) => ({
  indexes,
  isWritable,
  isReadonlyView,
  description,
  error,
  localAppRegistry: (appRegistry as any).localAppRegistry,
  isRefreshing,
  serverVersion,
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
