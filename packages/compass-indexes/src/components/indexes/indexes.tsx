import React from 'react';
import { css, Card, spacing } from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import type AppRegistry from 'hadron-app-registry';

import { sortIndexes } from '../../modules/indexes';

import { IndexesToolbar } from '../indexes-toolbar/indexes-toolbar';
import { IndexesTable } from '../indexes-table/indexes-table';
import type { IndexModel } from '../indexes-table/indexes-table';

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
  indexes: IndexModel[];
  isWritable: boolean;
  isReadonly: boolean;
  isReadonlyView: boolean;
  description?: string;
  error?: string;
  localAppRegistry: AppRegistry;
  onSortTable: (name: string, direction: 'asc' | 'desc') => void;
};

export const Indexes: React.FunctionComponent<IndexesProps> = ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  localAppRegistry,
  onSortTable,
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
          writeStateDescription={description}
        />
      </div>
      {!isReadonlyView && !error && (
        <div className={indexTableStyles}>
          <IndexesTable
            indexes={indexes}
            canDeleteIndex={isWritable && !isReadonly}
            onSortTable={onSortTable}
            onDeleteIndex={onDeleteIndex}
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
  appRegistry: { localAppRegistry },
}: any) => ({
  indexes,
  isWritable,
  isReadonly,
  isReadonlyView,
  description,
  error,
  localAppRegistry,
});

const mapDispatch = {
  onSortTable: sortIndexes,
};

export default connect(mapState, mapDispatch)(Indexes as any);
