import type {
  LGColumnDef,
  LeafyGreenTableRow,
} from '@mongodb-js/compass-components';

import type { MergedIndex, IndexInfo } from './use-regular-indexes-table';
import type { RegularIndex } from '../../modules/regular-indexes';

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

type SortableField = 'name' | 'type' | 'size' | 'usageCount' | 'status';

/**
 * Determines the display status for a regular index based on its build progress
 */
function determineRegularIndexStatus(
  index: RegularIndex
): 'inprogress' | 'ready' {
  if (index.buildProgress > 0 && index.buildProgress < 1) {
    return 'inprogress';
  }
  return 'ready';
}

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

  if (index.compassIndexType === 'rolling-index') {
    if (field === 'size' || field === 'usageCount') {
      return 0;
    }
    if (field === 'name') {
      return index.indexName;
    }
    if (field === 'type') {
      return index.indexType.label;
    }
    if (field === 'status') {
      return 'building';
    }
    return index[field];
  }

  if (field === 'status') {
    return determineRegularIndexStatus(index);
  }

  return index[field];
}

function isSupportedSortField(
  field: string
): field is 'name' | 'type' | 'size' | 'usageCount' | 'properties' | 'status' {
  return [
    'name',
    'type',
    'size',
    'usageCount',
    'properties',
    'status',
  ].includes(field);
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

// Columns for the indexes tab (full view)
export const COLUMNS: LGColumnDef<IndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name & Definition',
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
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => info.getValue(),
    sortingFn: sortFn,
    enableSorting: true,
  },
];

export const COLUMNS_WITH_ACTIONS: LGColumnDef<IndexInfo>[] = [
  ...COLUMNS,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];

// Columns for the indexes drawer (simplified view)
export const COLUMNS_FOR_DRAWER: LGColumnDef<IndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
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
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => info.getValue(),
    sortingFn: sortFn,
    enableSorting: true,
  },
];

export const COLUMNS_FOR_DRAWER_WITH_ACTIONS: LGColumnDef<IndexInfo>[] = [
  ...COLUMNS_FOR_DRAWER,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];
