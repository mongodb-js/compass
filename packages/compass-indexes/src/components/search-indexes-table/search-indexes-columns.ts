import type {
  LGColumnDef,
  LeafyGreenTableRow,
} from '@mongodb-js/compass-components';
import type { SearchIndexInfo } from './use-search-indexes-table';

function sortByStatus(
  rowA: LeafyGreenTableRow<SearchIndexInfo>,
  rowB: LeafyGreenTableRow<SearchIndexInfo>
) {
  if (typeof rowB.original.indexInfo.status === 'undefined') {
    return -1;
  }
  if (typeof rowA.original.indexInfo.status === 'undefined') {
    return 1;
  }
  if (rowA.original.indexInfo.status > rowB.original.indexInfo.status) {
    return -1;
  }
  if (rowA.original.indexInfo.status < rowB.original.indexInfo.status) {
    return 1;
  }
  return 0;
}

function sortByType(
  rowA: LeafyGreenTableRow<SearchIndexInfo>,
  rowB: LeafyGreenTableRow<SearchIndexInfo>
) {
  if (typeof rowB.original.indexInfo.type === 'undefined') {
    return -1;
  }
  if (typeof rowA.original.indexInfo.type === 'undefined') {
    return 1;
  }
  if (rowA.original.indexInfo.type > rowB.original.indexInfo.type) {
    return -1;
  }
  if (rowA.original.indexInfo.type < rowB.original.indexInfo.type) {
    return 1;
  }
  return 0;
}

const COLUMNS_COMMON: LGColumnDef<SearchIndexInfo>[] = [
  {
    accessorKey: 'type',
    header: 'Type',
    cell: (info) => info.getValue(),
    sortingFn: sortByType,
    enableSorting: true,
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: (info) => info.getValue(),
    sortingFn: sortByStatus,
    enableSorting: true,
  },
];

export const COLUMNS: LGColumnDef<SearchIndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name and Fields',
    enableSorting: true,
  },
  ...COLUMNS_COMMON,
];

export const COLUMNS_WITH_ACTIONS: LGColumnDef<SearchIndexInfo>[] = [
  ...COLUMNS,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];

export const COLUMNS_FOR_DRAWER: LGColumnDef<SearchIndexInfo>[] = [
  {
    accessorKey: 'name',
    header: 'Name',
    enableSorting: true,
  },
  ...COLUMNS_COMMON,
];

export const COLUMNS_FOR_DRAWER_WITH_ACTIONS: LGColumnDef<SearchIndexInfo>[] = [
  ...COLUMNS_FOR_DRAWER,
  {
    accessorKey: 'actions',
    header: '',
    cell: (info) => info.getValue(),
  },
];
