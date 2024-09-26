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

import type {
  RegularIndex,
  InProgressIndex,
  RollingIndex,
} from '../../modules/regular-indexes';

type RegularIndexesTableProps = {
  indexes: RegularIndex[];
  inProgressIndexes: InProgressIndex[];
  rollingIndexes: RollingIndex[];
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
  indexInfo: MergedIndex;
  type: React.ReactNode;
  size: React.ReactNode;
  usageCount: React.ReactNode;
  properties: React.ReactNode;
  actions: undefined | React.ReactNode;
  renderExpandedContent: React.ReactNode;
};

function mergedIndexPropertyValue(index: MergedIndex): string {
  if (index.compassIndexType !== 'regular-index') {
    // TODO
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
    if (field === 'type' || field === 'size' || field === 'usageCount') {
      // TODO: type should be supported
      return undefined;
    }
    return (index as InProgressIndex)[field];
  }

  if (index.compassIndexType === 'rolling-index') {
    if (field === 'size' || field === 'usageCount') {
      return undefined;
    }
    if (field === 'name') {
      return index.indexName;
    }
    if (field === 'type') {
      return index.indexType.label;
    }
  }

  return (index as RegularIndex)[field];
}

function sortFn(
  rowA: LeafyGreenTableRow<IndexInfo>,
  rowB: LeafyGreenTableRow<IndexInfo>,
  field: string
) {
  if (!['name', 'type', 'size', 'usageCount', 'properties'].includes(field)) {
    return 0;
  }

  if (field === 'properties') {
    const propSort = sortByProperties(
      rowA.original.indexInfo,
      rowB.original.indexInfo
    );
    return propSort;
  }

  const prop = field as unknown as SortableField;

  const fieldA = mergedIndexFieldValue(rowA.original.indexInfo, prop);
  const fieldB = mergedIndexFieldValue(rowB.original.indexInfo, prop);

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
type MappedRollingIndex = RollingIndex & { compassIndexType: 'rolling-index' };

type MergedIndex =
  | MappedRegularIndex
  | MappedInProgressIndex
  | MappedRollingIndex;

function mergeIndexes(
  indexes: RegularIndex[],
  inProgressIndexes: InProgressIndex[],
  rollingIndexes: RollingIndex[]
): MergedIndex[] {
  const mappedIndexes: MappedRegularIndex[] = indexes.map((index) => {
    return { ...index, compassIndexType: 'regular-index' };
  });

  const mappedInProgressIndexes: MappedInProgressIndex[] =
    inProgressIndexes.map((index) => {
      return { ...index, compassIndexType: 'in-progress-index' };
    });

  const mappedRollingIndexes: MappedRollingIndex[] = rollingIndexes.map(
    (index) => {
      return { ...index, compassIndexType: 'rolling-index' };
    }
  );

  return [
    ...mappedIndexes,
    ...mappedInProgressIndexes,
    ...mappedRollingIndexes,
  ];
}

type CommonIndexInfo = Omit<IndexInfo, 'actions' | 'renderExpandedContent'>;

function getInProgressIndexInfo(index: MappedInProgressIndex): CommonIndexInfo {
  return {
    id: index.id,
    name: index.name,
    indexInfo: index,
    type: undefined, // TODO
    size: <SizeField size={0} relativeSize={0} />,
    usageCount: <UsageField usage={undefined} since={undefined} />,
    properties: (
      <PropertyField cardinality={undefined} extra={{}} properties={[]} />
    ),
  };
}

function getRollingIndexInfo(index: MappedRollingIndex): CommonIndexInfo {
  return {
    id: `rollingIndex-${index.indexName}`,
    name: index.indexName,
    indexInfo: index,
    type: index.indexType.label,
    size: <SizeField size={0} relativeSize={0} />,
    usageCount: <UsageField usage={undefined} since={undefined} />,
    // TODO
    properties: (
      <PropertyField cardinality={undefined} extra={{}} properties={[]} />
    ),
  };
}

function getRegularIndexInfo(index: MappedRegularIndex): CommonIndexInfo {
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
  };
}

export const RegularIndexesTable: React.FunctionComponent<
  RegularIndexesTableProps
> = ({
  isWritable,
  readOnly,
  indexes,
  inProgressIndexes,
  rollingIndexes,
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

  const allIndexes: MergedIndex[] = mergeIndexes(
    indexes,
    inProgressIndexes,
    rollingIndexes
  );

  const data = useMemo<LGTableDataType<IndexInfo>[]>(
    () =>
      allIndexes.map((index) => {
        let indexData: CommonIndexInfo;
        if (index.compassIndexType === 'in-progress-index') {
          indexData = getInProgressIndexInfo(index);
        } else if (index.compassIndexType === 'rolling-index') {
          indexData = getRollingIndexInfo(index);
        } else {
          indexData = getRegularIndexInfo(index);
        }

        const indexActionsIndex = {
          name:
            index.compassIndexType === 'rolling-index'
              ? index.indexName
              : index.name,
          extra:
            index.compassIndexType === 'regular-index'
              ? index.extra
              : undefined,
        };

        return {
          ...indexData,
          actions: indexData.name !== '_id_' && (
            <IndexActions
              index={indexActionsIndex}
              serverVersion={serverVersion}
              onDeleteIndexClick={onDeleteIndexClick}
              onHideIndexClick={onHideIndexClick}
              onUnhideIndexClick={onUnhideIndexClick}
            ></IndexActions>
          ),

          // eslint-disable-next-line react/display-name
          renderExpandedContent: () => (
            // TODO: we should support badges for other index types
            <IndexKeysBadge
              keys={
                index.compassIndexType === 'regular-index' ? index.fields : []
              }
              data-testid={`indexes-details-${indexData.name}`}
            />
          ),
        };
      }),
    [
      allIndexes,
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
  inProgressIndexes: regularIndexes.inProgressIndexes,
  rollingIndexes: regularIndexes.rollingIndexes ?? [],
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
