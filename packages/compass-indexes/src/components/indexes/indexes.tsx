import React from 'react';
import { css, Card, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';

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
  display: 'grid',
  gridTemplateAreas: `
    'toolbar'
    'indexTable'
  `,
  width: '100%',
  overflow: 'hidden',
  alignContent: 'start',
});
const toolbarStyles = css({
  gridArea: 'toolbar',
});
const indexTableStyles = css({
  gridArea: 'indexTable',
  overflow: 'auto',
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
      <div className={toolbarStyles}>
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
      </div>
      {!isReadonlyView && !error && (
        <div className={indexTableStyles}>
          <IndexesTable
            indexes={indexes}
            canDeleteIndex={isWritable && !isReadonly}
            onSortTable={sortIndexes}
            onDeleteIndex={deleteIndex}
          />
        </div>
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
