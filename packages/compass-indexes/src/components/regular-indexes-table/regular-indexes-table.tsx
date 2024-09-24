import React, { useMemo, useEffect } from 'react';
import { connect } from 'react-redux';
import { withPreferences } from 'compass-preferences-model/provider';
import { useWorkspaceTabId } from '@mongodb-js/compass-workspaces/provider';
import { IndexKeysBadge } from '@mongodb-js/compass-components';
import type {
  LGColumnDef,
  LGTableDataType,
  LeafyGreenTableRow,
} from '@mongodb-js/compass-components';

import type { RootState } from '../../modules';

import TypeField from './type-field';
import SizeField from './size-field';
import UsageField from './usage-field';
import PropertyField from './property-field';
import IndexActions from './index-actions';
import { IndexesTable } from '../indexes-table';

import {
  dropIndex,
  hideIndex,
  unhideIndex,
  startPollingRegularIndexes,
  stopPollingRegularIndexes,
} from '../../modules/regular-indexes';

import { type RegularIndex } from '../../modules/regular-indexes';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  serverVersion: string;
  isWritable?: boolean;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  readOnly?: boolean;
  error?: string | null;
  onRegularIndexesOpened: (tabId: string) => void;
  onRegularIndexesClosed: (tabId: string) => void;
};

type IndexInfo = {
  id: string;
  name: string;
  indexInfo: RegularIndex;
  type: React.ReactNode;
  size: React.ReactNode;
  usage: React.ReactNode;
  properties: React.ReactNode;
  actions: undefined | React.ReactNode;
  renderExpandedContent: React.ReactNode;
};

function sortByProperties(a: RegularIndex, b: RegularIndex) {
  const aValue =
    a.cardinality === 'compound' ? 'compound' : a.properties?.[0] || '';
  const bValue =
    b.cardinality === 'compound' ? 'compound' : b.properties?.[0] || '';
  if (aValue > bValue) {
    return -1;
  }
  if (aValue < bValue) {
    return 1;
  }
  return 0;
}

function sortFn(
  rowA: LeafyGreenTableRow<IndexInfo>,
  rowB: LeafyGreenTableRow<IndexInfo>,
  field: string
) {
  if (field === 'properties') {
    const propSort = sortByProperties(
      rowA.original.indexInfo,
      rowB.original.indexInfo
    );
    return propSort;
  }

  if (field === 'usage') {
    field = 'usageCount';
  }

  const fieldA = rowA.original.indexInfo[field as keyof RegularIndex]!;
  const fieldB = rowB.original.indexInfo[field as keyof RegularIndex]!;

  if (fieldA > fieldB) return -1;
  if (fieldB > fieldA) return 1;
  return 0;
}

const COLUMNS: LGColumnDef<IndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name and Definition',
    enableSorting: true,
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: (info) => info.getValue(),
    enableSorting: true,
    sortingFn: sortFn,
  },
  {
    accessorKey: 'size',
    header: 'Size',
    cell: (info) => info.getValue(),
    enableSorting: true,
    sortingFn: sortFn,
  },
  {
    accessorKey: 'usage',
    header: 'Usage',
    cell: (info) => info.getValue(),
    sortingFn: sortFn,
    // The usage contains the date string so we
    // want it to have a good amount of space.
    size: 300,
    enableSorting: true,
  },
  {
    accessorKey: 'properties',
    header: 'Properties',
    cell: (info) => info.getValue(),
    sortingFn: sortFn,
    enableSorting: true,
  },
];

const COLUMNS_WITH_ACTIONS: LGColumnDef<IndexInfo>[] = [
  ...COLUMNS,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  isWritable,
  readOnly,
  indexes,
  serverVersion,
  onHideIndexClick,
  onUnhideIndexClick,
  onDeleteIndexClick,
  onRegularIndexesOpened,
  onRegularIndexesClosed,
  error,
}) => {
  const tabId = useWorkspaceTabId();

  useEffect(() => {
    onRegularIndexesOpened(tabId);
    return () => {
      onRegularIndexesClosed(tabId);
    };
  }, [tabId, onRegularIndexesOpened, onRegularIndexesClosed]);

  const data = useMemo<LGTableDataType<IndexInfo>[]>(
    () =>
      indexes.map((index) => ({
        id: index.name,
        name: index.name,
        indexInfo: index,
        type: <TypeField type={index.type} extra={index.extra} />,
        size: <SizeField size={index.size} relativeSize={index.relativeSize} />,
        usage: <UsageField usage={index.usageCount} since={index.usageSince} />,
        properties: (
          <PropertyField
            cardinality={index.cardinality}
            extra={index.extra}
            properties={index.properties}
          />
        ),
        actions: index.name !== '_id_' &&
          index.extra.status !== 'inprogress' && (
            <IndexActions
              index={index}
              serverVersion={serverVersion}
              onDeleteIndexClick={onDeleteIndexClick}
              onHideIndexClick={onHideIndexClick}
              onUnhideIndexClick={onUnhideIndexClick}
            ></IndexActions>
          ),

        // eslint-disable-next-line react/display-name
        renderExpandedContent: () => (
          <IndexKeysBadge
            keys={index.fields}
            data-testid={`indexes-details-${index.name}`}
          />
        ),
      })),
    [
      indexes,
      onDeleteIndexClick,
      onHideIndexClick,
      onUnhideIndexClick,
      serverVersion,
    ]
  );

  if (error) {
    // We don't render the table if there is an error. The toolbar takes care of
    // displaying it.
    return null;
  }

  const canModifyIndex = isWritable && !readOnly;

  return (
    <IndexesTable
      id="regular-indexes"
      data-testid="indexes"
      columns={canModifyIndex ? COLUMNS_WITH_ACTIONS : COLUMNS}
      data={data}
    />
  );
};

const mapState = ({
  serverVersion,
  regularIndexes,
  isWritable,
}: RootState) => ({
  isWritable,
  serverVersion,
  indexes: regularIndexes.indexes,
  error: regularIndexes.error,
});

const mapDispatch = {
  onDeleteIndexClick: dropIndex,
  onHideIndexClick: hideIndex,
  onUnhideIndexClick: unhideIndex,
  onRegularIndexesOpened: startPollingRegularIndexes,
  onRegularIndexesClosed: stopPollingRegularIndexes,
};

export default connect(
  mapState,
  mapDispatch
)(withPreferences(RegularIndexesTable, ['readOnly']));
