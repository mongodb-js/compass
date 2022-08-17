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
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  height: 'auto',
  overflowY: 'scroll',
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
  return (
    <Card className={containerStyles} data-testid="indexes">
      <IndexesToolbar
        isWritable={isWritable}
        isReadonly={isReadonly}
        isReadonlyView={isReadonlyView}
        errorMessage={error}
        localAppRegistry={localAppRegistry}
        writeStateDescription={description}
      />
      {!isReadonlyView && !error && (
        <IndexesTable
          indexes={indexes}
          isReadonly={isReadonly}
          isWritable={isWritable}
          localAppRegistry={localAppRegistry}
          onSortTable={onSortTable}
        />
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
