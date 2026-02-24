import React from 'react';
import { connect, useSelector } from 'react-redux';
import { usePreferences } from 'compass-preferences-model/provider';

import type { RootState } from '../../modules';
import { IndexesTable } from '../indexes-table';

import {
  dropIndex,
  dropFailedIndex,
  hideIndex,
  unhideIndex,
} from '../../modules/regular-indexes';

import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';
import { selectReadWriteAccess } from '../../utils/indexes-read-write-access';
import { useConnectionInfo } from '@mongodb-js/compass-connections/provider';

import { useRegularIndexesTable } from './use-regular-indexes-table';
import {
  COLUMNS_FOR_DRAWER,
  COLUMNS_FOR_DRAWER_WITH_ACTIONS,
} from './regular-indexes-columns';

type RegularIndexesDrawerTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes: RollingIndex[];
  serverVersion: string;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  onDeleteFailedIndexClick: (name: string) => void;
  error?: string | null;
};

export const RegularIndexesDrawerTable: React.FunctionComponent<
  RegularIndexesDrawerTableProps
> = ({
  indexes,
  inProgressIndexes,
  rollingIndexes,
  serverVersion,
  onHideIndexClick,
  onUnhideIndexClick,
  onDeleteIndexClick,
  onDeleteFailedIndexClick,
  error,
}) => {
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
    return null;
  }

  return (
    <IndexesTable
      id="regular-indexes"
      data-testid="indexes"
      columns={
        isRegularIndexesWritable
          ? COLUMNS_FOR_DRAWER_WITH_ACTIONS
          : COLUMNS_FOR_DRAWER
      }
      data={data}
      isDrawer={true}
    />
  );
};

const mapState = ({ serverVersion, regularIndexes }: RootState) => ({
  serverVersion,
  inProgressIndexes: regularIndexes.inProgressIndexes,
  rollingIndexes: regularIndexes.rollingIndexes ?? [],
  error: regularIndexes.error,
});

const mapDispatch = {
  onDeleteIndexClick: dropIndex,
  onDeleteFailedIndexClick: dropFailedIndex,
  onHideIndexClick: hideIndex,
  onUnhideIndexClick: unhideIndex,
};

export default connect(mapState, mapDispatch)(RegularIndexesDrawerTable);
