import React, { useCallback, useMemo } from 'react';
import { connect, useSelector, shallowEqual } from 'react-redux';
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
import type { MergedIndex } from './use-regular-indexes-table';
import TypeField from './type-field';
import {
  COLUMNS_FOR_DRAWER,
  COLUMNS_FOR_DRAWER_WITH_ACTIONS,
} from './regular-indexes-columns';
import {
  Button,
  css,
  EmptyContent,
  InlineDefinition,
} from '@mongodb-js/compass-components';
import { ZeroRegularIndexesGraphic } from '../icons/zero-regular-indexes-graphic';
import { createIndexOpened } from '../../modules/create-index';

const emptyContentStyles = css({
  marginTop: 0,
});

const tableWrapperStyles = css({
  overflowX: 'auto',
});

const drawerCellStyles = css({
  ':first-of-type': {
    paddingLeft: 0,
  },
  ':last-of-type': {
    paddingRight: 0,
  },
});

type ZeroStateProps = {
  isRegularIndexesWritable: boolean;
  onCreateRegularIndexClick: () => void;
};

const ZeroState: React.FunctionComponent<ZeroStateProps> = ({
  isRegularIndexesWritable,
  onCreateRegularIndexClick,
}) => {
  return (
    <EmptyContent
      containerClassName={emptyContentStyles}
      icon={ZeroRegularIndexesGraphic}
      title="No standard indexes found"
      callToActionLink={
        <Button
          disabled={!isRegularIndexesWritable}
          onClick={onCreateRegularIndexClick}
          size="xsmall"
        >
          Create index
        </Button>
      }
    />
  );
};

type RegularIndexesDrawerTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes: RollingIndex[];
  serverVersion: string;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  onDeleteFailedIndexClick: (name: string) => void;
  onCreateRegularIndexClick: () => void;
  error?: string | null;
  searchTerm?: string;
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
  onCreateRegularIndexClick,
  error,
  searchTerm,
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
    }),
    shallowEqual
  );

  const renderNameOverride = useCallback((name: string) => {
    if (name.length > 8) {
      return (
        <InlineDefinition definition={name}>{`${name.slice(
          0,
          8
        )}…`}</InlineDefinition>
      );
    }

    return name;
  }, []);

  const renderTypeOverride = useCallback((index: MergedIndex) => {
    if (index.compassIndexType === 'in-progress-index') {
      return <TypeField type="unknown" noBadge />;
    }
    if (index.compassIndexType === 'rolling-index') {
      return (
        <TypeField
          type={index.indexType.label as RegularIndex['type']}
          noBadge
        />
      );
    }
    return <TypeField type={index.type} extra={index.extra} noBadge />;
  }, []);

  const { data: allData } = useRegularIndexesTable({
    indexes,
    inProgressIndexes,
    rollingIndexes,
    serverVersion,
    onHideIndexClick,
    onUnhideIndexClick,
    onDeleteIndexClick,
    onDeleteFailedIndexClick,
    renderNameOverride,
    renderTypeOverride,
  });

  // Filter data based on search term
  const data = useMemo(() => {
    if (!searchTerm) {
      return allData;
    }
    return allData.filter((item) => item.name.includes(searchTerm));
  }, [allData, searchTerm]);

  if (error) {
    return null;
  }

  // Show empty content if no indexes match the filter
  if (data.length === 0) {
    return (
      <ZeroState
        isRegularIndexesWritable={isRegularIndexesWritable}
        onCreateRegularIndexClick={onCreateRegularIndexClick}
      />
    );
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
      tableWrapperClassName={tableWrapperStyles}
      cellClassName={drawerCellStyles}
      showActionsOnHover={false}
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
  onCreateRegularIndexClick: createIndexOpened,
};

export default connect(mapState, mapDispatch)(RegularIndexesDrawerTable);
