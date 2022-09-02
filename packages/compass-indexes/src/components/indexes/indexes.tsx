import React from 'react';
import { css, Card, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';

import { sortIndexes } from '../../modules/indexes';
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
});

type IndexesProps = {
  indexes: IndexDefinition[];
  isWritable: boolean;
  isReadonly: boolean;
  isReadonlyView: boolean;
  description?: string;
  error: string | null;
  localAppRegistry: AppRegistry;
  globalAppRegistry: AppRegistry;
  isRefreshing: boolean;
  onSortTable: (name: SortColumn, direction: SortDirection) => void;
  onRefresh: () => void;
};

export const Indexes: React.FunctionComponent<IndexesProps> = ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  localAppRegistry,
  globalAppRegistry,
  isRefreshing,
  onSortTable,
  onRefresh,
}) => {
  const onDeleteIndex = (name: string) => {
    return localAppRegistry.emit('toggle-drop-index-modal', true, name);
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
          onRefreshIndexes={() => onRefresh()}
        />
      </div>
      {!isReadonlyView && !error && (
        <div className={indexTableStyles}>
          <IndexesTable
            indexes={indexes}
            canDeleteIndex={isWritable && !isReadonly}
            onSortTable={onSortTable}
            onDeleteIndex={onDeleteIndex}
            globalAppRegistry={globalAppRegistry}
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
  globalAppRegistry: (appRegistry as any).globalAppRegistry,
  isRefreshing,
});

const mapDispatch = {
  onSortTable: sortIndexes,
  onRefresh: refreshIndexes,
};

export default connect(mapState, mapDispatch)(Indexes);
