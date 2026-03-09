import React, { useEffect } from 'react';
import { connect, useSelector } from 'react-redux';
import { usePreferences } from 'compass-preferences-model/provider';
import { useWorkspaceTabId } from '@mongodb-js/compass-workspaces/provider';

import type { RootState } from '../../modules';
import { IndexesTable } from '../indexes-table';

import {
  dropIndex,
  dropFailedIndex,
  hideIndex,
  unhideIndex,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
} from '../../modules/regular-indexes';

import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

import { useRegularIndexesTable } from './use-regular-indexes-table';
import { COLUMNS, COLUMNS_WITH_ACTIONS } from './regular-indexes-columns';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes: RollingIndex[];
  serverVersion: string;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  onDeleteFailedIndexClick: (name: string) => void;
  error?: string | null;
  onRegularIndexesOpened: (tabId: string) => void;
  onRegularIndexesClosed: (tabId: string) => void;
};

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  indexes,
  inProgressIndexes,
  rollingIndexes,
  serverVersion,
  onHideIndexClick,
  onUnhideIndexClick,
  onDeleteIndexClick,
  onDeleteFailedIndexClick,
  onRegularIndexesOpened,
  onRegularIndexesClosed,
  error,
}) => {
  const tabId = useWorkspaceTabId();
  const { atlasMetadata } = useConnectionInfo();
  const { readOnly, readWrite, enableAtlasSearchIndexes } = usePreferences([
    'readOnly',
    'readWrite',
    'enableAtlasSearchIndexes',
  ]);
  const { isRegularIndexesWritable } = useSelector(
    selectReadWriteAccess({
      isAtlas: !!atlasMetadata,
      readOnly,
      readWrite,
      enableAtlasSearchIndexes,
    })
  );

  useEffect(() => {
    onRegularIndexesOpened(tabId);
    return () => {
      onRegularIndexesClosed(tabId);
    };
  }, [tabId, onRegularIndexesOpened, onRegularIndexesClosed]);

  const { data } = useRegularIndexesTable({
    indexes,
    inProgressIndexes,
    rollingIndexes,
    serverVersion,
    onHideIndexClick,
    onUnhideIndexClick,
    onDeleteIndexClick,
    onDeleteFailedIndexClick,
  });

  if (error) {
    // We don't render the table if there is an error. The toolbar takes care of
    // displaying it.
    return null;
  }

  return (
    <IndexesTable
      id="regular-indexes"
      data-testid="indexes"
      columns={isRegularIndexesWritable ? COLUMNS_WITH_ACTIONS : COLUMNS}
      data={data}
    />
  );
};

const mapState = ({ serverVersion, regularIndexes }: RootState) => ({
  serverVersion,
  indexes: regularIndexes.indexes,
  inProgressIndexes: regularIndexes.inProgressIndexes,
  rollingIndexes: regularIndexes.rollingIndexes ?? [],
  error: regularIndexes.error,
});

const mapDispatch = {
  onDeleteIndexClick: dropIndex,
  onDeleteFailedIndexClick: dropFailedIndex,
  onHideIndexClick: hideIndex,
  onUnhideIndexClick: unhideIndex,
  onRegularIndexesOpened: startPollingRegularIndexes,
  onRegularIndexesClosed: stopPollingRegularIndexes,
};

export default connect(mapState, mapDispatch)(RegularIndexesTable);
