/* eslint-disable react/prop-types */
import type { ComponentProps } from 'react';
import React from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';
import type { Database as _Database } from '@mongodb-js/compass-store';
import {
  useDatabaseStats,
  isError,
  isReady,
  observer,
} from '@mongodb-js/compass-store';

// For mobx we can just pass real thing here. For redux it's just the name
// type Database = _Database;
type Database = string;

const DatabaseItem: React.FunctionComponent<
  { item: Database } & Pick<
    ComponentProps<typeof NamespaceItemCard>,
    'viewType' | 'onItemClick'
  >
> = observer(({ item, ...props }) => {
  // For mobx we can just pass real thing here. For redux it's just the name
  const dbName = item.name;
  // const dbName = item;
  const { data: stats, status } = useDatabaseStats(dbName) ?? {};

  return (
    <NamespaceItemCard
      id={dbName}
      name={dbName}
      type="database"
      status={
        !status
          ? 'initial'
          : isReady(status)
          ? 'ready'
          : isError(status)
          ? 'error'
          : 'fetching'
      }
      data={[
        {
          label: 'Storage size',
          value: compactBytes(stats?.storageSize ?? 0),
          hint: `Uncompressed data size: ${compactBytes(stats?.dataSize ?? 0)}`,
        },
        {
          label: 'Collections',
          value: compactNumber(stats?.collectionCount ?? 0),
        },
        {
          label: 'Indexes',
          value: compactNumber(stats?.indexCount ?? 0),
        },
      ]}
      {...props}
    ></NamespaceItemCard>
  );
});

const DATABASE_CARD_WIDTH = spacing[6] * 4;

const DATABASE_CARD_HEIGHT = 154;

const DATABASE_CARD_LIST_HEIGHT = 118;

const DatabasesList: React.FunctionComponent<{
  databases: Database[];
  onDatabasesSort: Function;
  sortValue: { sortBy: string; order: number };
  onDatabaseClick(id: string): void;
  onDeleteDatabaseClick?: (id: string) => void;
  onCreateDatabaseClick?: () => void;
}> = ({
  databases,
  onDatabaseClick,
  onCreateDatabaseClick,
  onDeleteDatabaseClick,
  // Only needed for Redux
  onDatabasesSort,
  sortValue,
  // ---
}) => {
  return (
    <ItemsGrid
      items={databases}
      itemType="database"
      itemGridWidth={DATABASE_CARD_WIDTH}
      itemGridHeight={DATABASE_CARD_HEIGHT}
      itemListHeight={DATABASE_CARD_LIST_HEIGHT}
      // NB: With mobx we can just pass the normal database items here and
      // keep the sort and filter logic encapsulated in the view. For redux
      // every piece of state that touches something in global store needs to
      // be moved to global store, otherwiser avoiding performance issues is
      // impossible. For this sorting logic this means extracting the actual
      // sorting to the store and providing onSort, sortBy properties instead
      // of encapsulating this stuff
      sortBy={[
        { name: 'name', label: 'Database Name' },
        { name: 'stats.data.storageSize', label: 'Storage size' },
        { name: 'stats.data.collectionCount', label: 'Collections' },
        { name: 'stats.data.indexCount', label: 'Indexes' },
      ]}
      // This is redux only thing that is not needed for mobx implementation
      sortValue={sortValue}
      onSort={onDatabasesSort}
      // ---
      onItemClick={onDatabaseClick}
      onDeleteItemClick={onDeleteDatabaseClick}
      onCreateItemClick={onCreateDatabaseClick}
      renderItem={DatabaseItem}
    ></ItemsGrid>
  );
};

export { DatabasesList };
