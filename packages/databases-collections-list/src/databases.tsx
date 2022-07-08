/* eslint-disable react/prop-types */
import React, { ComponentProps } from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';
import {
  useDatabaseStats,
  isError,
  isReady,
  useDatabases,
} from '@mongodb-js/compass-store';

type Database = ReturnType<typeof useDatabases>['items'][number];

const DatabaseItem: React.FunctionComponent<
  { item: string } & Pick<
    ComponentProps<typeof NamespaceItemCard>,
    'viewType' | 'onItemClick'
  >
> = ({ item, ...props }) => {
  const dbName = item;
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
};

const DATABASE_CARD_WIDTH = spacing[6] * 4;

const DATABASE_CARD_HEIGHT = 154;

const DATABASE_CARD_LIST_HEIGHT = 118;

const DatabasesList: React.FunctionComponent<{
  databases: string[];
  onDatabaseClick(id: string): void;
  onDeleteDatabaseClick?: (id: string) => void;
  onCreateDatabaseClick?: () => void;
}> = ({
  databases,
  onDatabaseClick,
  onCreateDatabaseClick,
  onDeleteDatabaseClick,
}) => {
  return (
    <ItemsGrid
      items={databases}
      itemType="database"
      itemGridWidth={DATABASE_CARD_WIDTH}
      itemGridHeight={DATABASE_CARD_HEIGHT}
      itemListHeight={DATABASE_CARD_LIST_HEIGHT}
      sortBy={[
        { name: 'name', label: 'Database Name' },
        { name: 'storage_size', label: 'Storage size' },
        { name: 'collectionsLength', label: 'Collections' },
        { name: 'index_count', label: 'Indexes' },
      ]}
      onItemClick={onDatabaseClick}
      onDeleteItemClick={onDeleteDatabaseClick}
      onCreateItemClick={onCreateDatabaseClick}
      renderItem={DatabaseItem}
    ></ItemsGrid>
  );
};

export { DatabasesList };
