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
import RegularIndexActions from './regular-index-actions';
import InProgressIndexActions from './in-progress-index-actions';
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
} from '../../modules/regular-indexes';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  serverVersion: string;
  isWritable?: boolean;
  onHideIndexClick: (name: string) => void;
  onUnhideIndexClick: (name: string) => void;
  onDeleteIndexClick: (name: string) => void;
  onDeleteFailedIndexClick: (name: string) => void;
  readOnly?: boolean;
  error?: string | null;
  onRegularIndexesOpened: (tabId: string) => void;
  onRegularIndexesClosed: (tabId: string) => void;
};

type IndexInfo = {
  id: string;
  name: string;
  indexInfo: MergedIndex;
  type: React.ReactNode;
  size: React.ReactNode;
  usageCount: React.ReactNode;
  properties: React.ReactNode;
  actions: undefined | React.ReactNode;
  renderExpandedContent: React.ReactNode;
};

function mergedIndexPropertyValue(index: MergedIndex): string {
  // TODO(COMPASS-8335): right now only regular indexes have properties &
  // cardinality
  if (index.compassIndexType !== 'regular-index') {
    return '';
  }

  return index.cardinality === 'compound'
    ? 'compound'
    : index.properties?.[0] || '';
}

function sortByProperties(a: MergedIndex, b: MergedIndex) {
  const aValue = mergedIndexPropertyValue(a);
  const bValue = mergedIndexPropertyValue(b);
  if (aValue > bValue) {
    return -1;
  }
  if (aValue < bValue) {
    return 1;
  }
  return 0;
}

type SortableField = 'name' | 'type' | 'size' | 'usageCount';

function mergedIndexFieldValue(
  index: MergedIndex,
  field: SortableField
): string | number | undefined {
  if (index.compassIndexType === 'in-progress-index') {
    if (field === 'type') {
      // TODO(COMPASS-8335): type should be supported by in-progress-index
      return 'unknown';
    }
    if (field === 'size' || field === 'usageCount') {
      return 0;
    }
    return index[field];
  }

  return index[field];
}

function isSupportedSortField(
  field: string
): field is 'name' | 'type' | 'size' | 'usageCount' | 'properties' {
  return ['name', 'type', 'size', 'usageCount', 'properties'].includes(field);
}

function sortFn(
  rowA: LeafyGreenTableRow<IndexInfo>,
  rowB: LeafyGreenTableRow<IndexInfo>,
  field: string
) {
  if (!isSupportedSortField(field)) {
    return 0;
  }

  if (field === 'properties') {
    const propSort = sortByProperties(
      rowA.original.indexInfo,
      rowB.original.indexInfo
    );
    return propSort;
  }

  const fieldA = mergedIndexFieldValue(rowA.original.indexInfo, field);
  const fieldB = mergedIndexFieldValue(rowB.original.indexInfo, field);

  if (fieldA === undefined || fieldB === undefined) {
    return 0;
  }

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
    accessorKey: 'usageCount',
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

// compassIndexType because type is taken by RegularIndex. indexType is taken by AtlasIndexStats.
type MappedRegularIndex = RegularIndex & { compassIndexType: 'regular-index' };
type MappedInProgressIndex = InProgressIndex & {
  compassIndexType: 'in-progress-index';
};

type MergedIndex = MappedRegularIndex | MappedInProgressIndex;

function mergeIndexes(
  indexes: RegularIndex[],
  inProgressIndexes: InProgressIndex[]
): MergedIndex[] {
  const mappedIndexes: MappedRegularIndex[] = indexes.map((index) => {
    return { ...index, compassIndexType: 'regular-index' };
  });

  const mappedInProgressIndexes: MappedInProgressIndex[] =
    inProgressIndexes.map((index) => {
      return { ...index, compassIndexType: 'in-progress-index' };
    });

  return [...mappedIndexes, ...mappedInProgressIndexes];
}

type CommonIndexInfo = Omit<IndexInfo, 'renderExpandedContent'>;

function getInProgressIndexInfo(
  index: MappedInProgressIndex,
  {
    onDeleteFailedIndexClick,
  }: {
    onDeleteFailedIndexClick: (indexName: string) => void;
  }
): CommonIndexInfo {
  return {
    id: index.id,
    name: index.name,
    indexInfo: index,
    type: <TypeField type="unknown" />,
    size: <SizeField size={0} relativeSize={0} />,
    usageCount: <UsageField usage={undefined} since={undefined} />,
    properties: (
      <PropertyField
        status={index.status}
        error={index.error}
        properties={[]}
      />
    ),
    actions: (
      <InProgressIndexActions
        index={index}
        onDeleteFailedIndexClick={onDeleteFailedIndexClick}
      ></InProgressIndexActions>
    ),
  };
}

function getRegularIndexInfo(
  index: MappedRegularIndex,
  {
    serverVersion,
    onHideIndexClick,
    onUnhideIndexClick,
    onDeleteIndexClick,
  }: {
    serverVersion: string;
    onHideIndexClick: (indexName: string) => void;
    onUnhideIndexClick: (indexName: string) => void;
    onDeleteIndexClick: (indexName: string) => void;
  }
): CommonIndexInfo {
  return {
    id: index.name,
    name: index.name,
    indexInfo: index,
    type: <TypeField type={index.type} extra={index.extra} />,
    size: <SizeField size={index.size} relativeSize={index.relativeSize} />,
    usageCount: (
      <UsageField usage={index.usageCount} since={index.usageSince} />
    ),
    properties: (
      <PropertyField
        cardinality={index.cardinality}
        extra={index.extra}
        properties={index.properties}
      />
    ),
    actions: index.name !== '_id_' && (
      <RegularIndexActions
        index={index}
        serverVersion={serverVersion}
        onDeleteIndexClick={onDeleteIndexClick}
        onHideIndexClick={onHideIndexClick}
        onUnhideIndexClick={onUnhideIndexClick}
      ></RegularIndexActions>
    ),
  };
}

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  isWritable,
  readOnly,
  indexes,
  inProgressIndexes,
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

  useEffect(() => {
    onRegularIndexesOpened(tabId);
    return () => {
      onRegularIndexesClosed(tabId);
    };
  }, [tabId, onRegularIndexesOpened, onRegularIndexesClosed]);

  const allIndexes: MergedIndex[] = mergeIndexes(indexes, inProgressIndexes);

  const data = useMemo<LGTableDataType<IndexInfo>[]>(
    () =>
      allIndexes.map((index) => {
        let indexData: CommonIndexInfo;
        if (index.compassIndexType === 'in-progress-index') {
          indexData = getInProgressIndexInfo(index, {
            onDeleteFailedIndexClick,
          });
        } else {
          indexData = getRegularIndexInfo(index, {
            serverVersion,
            onDeleteIndexClick,
            onHideIndexClick,
            onUnhideIndexClick,
          });
        }

        return {
          ...indexData,
          renderExpandedContent() {
            return (
              <IndexKeysBadge
                keys={index.fields}
                data-testid={`indexes-details-${indexData.name}`}
              />
            );
          },
        };
      }),
    [
      allIndexes,
      onDeleteIndexClick,
      onDeleteFailedIndexClick,
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
  inProgressIndexes: regularIndexes.inProgressIndexes,
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

export default connect(
  mapState,
  mapDispatch
)(withPreferences(RegularIndexesTable, ['readOnly']));
