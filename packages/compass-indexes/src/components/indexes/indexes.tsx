import React from 'react';
import { css, Card, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';
import AutoSizer from 'react-virtualized-auto-sizer';

import { sortIndexes, dropFailedIndex } from '../../modules/indexes';
import type {
  IndexDefinition,
  SortColumn,
  SortDirection,
} from '../../modules/indexes';

import { IndexesToolbar } from '../indexes-toolbar/indexes-toolbar';
import { IndexesTable } from '../indexes-table/indexes-table';
import { refreshIndexes } from '../../modules/is-refreshing';
import type { RootState } from '../../modules';

const containerStyles = css({
  margin: spacing[3],
  padding: spacing[3],
  overflow: 'hidden',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

type IndexesProps = {
  indexes: IndexDefinition[];
  isWritable: boolean;
  isReadonly: boolean;
  isReadonlyView: boolean;
  description?: string;
  error: string | null;
  localAppRegistry: AppRegistry;
  isRefreshing: boolean;
  sortIndexes: (name: SortColumn, direction: SortDirection) => void;
  refreshIndexes: () => void;
  dropFailedIndex: (id: string) => void;
};

export const Indexes: React.FunctionComponent<IndexesProps> = ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  localAppRegistry,
  isRefreshing,
  sortIndexes,
  refreshIndexes,
  dropFailedIndex,
}) => {
  const deleteIndex = (index: IndexDefinition) => {
    if (index.extra.status === 'failed') {
      return dropFailedIndex(String(index.extra.id));
    }

    return localAppRegistry.emit('toggle-drop-index-modal', true, index.name);
  };
  return (
    <Card className={containerStyles} data-testid="indexes">
      <IndexesToolbar
        isWritable={isWritable}
        isReadonly={isReadonly}
        isReadonlyView={isReadonlyView}
        errorMessage={error}
        localAppRegistry={localAppRegistry}
        isRefreshing={isRefreshing}
        writeStateDescription={description}
        onRefreshIndexes={refreshIndexes}
      />
      {!isReadonlyView && !error && (
        <AutoSizer disableWidth>
          {({ height }) => (
            <IndexesTable
              indexes={indexes}
              canDeleteIndex={isWritable && !isReadonly}
              onSortTable={sortIndexes}
              onDeleteIndex={deleteIndex}
              // Preserve the (table and card bottom) paddings
              scrollHeight={height - 48}
            />
          )}
        </AutoSizer>
      )}
    </Card>
  );
};

const mapState = ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  isRefreshing,
  appRegistry,
}: RootState) => ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  localAppRegistry: (appRegistry as any).localAppRegistry,
  isRefreshing,
});

const mapDispatch = {
  sortIndexes,
  refreshIndexes,
  dropFailedIndex,
};

export default connect(mapState, mapDispatch)(Indexes);
