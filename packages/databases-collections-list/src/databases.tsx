/* eslint-disable react/prop-types */
import React from 'react';
import { PerformanceSignals, spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';
import type { DatabaseProps } from 'mongodb-database-model';

const DATABASE_CARD_WIDTH = spacing[1600] * 4;

const DATABASE_CARD_HEIGHT = 154;

const DATABASE_CARD_LIST_HEIGHT = 118;

const DatabasesList: React.FunctionComponent<{
  databases: DatabaseProps[];
  onDatabaseClick(id: string): void;
  onDeleteDatabaseClick?: (id: string) => void;
  onCreateDatabaseClick?: () => void;
  onRefreshClick?: () => void;
  renderLoadSampleDataBanner?: () => React.ReactNode;
}> = ({
  databases,
  onDatabaseClick,
  onCreateDatabaseClick,
  onDeleteDatabaseClick,
  onRefreshClick,
  renderLoadSampleDataBanner,
}) => {
  console.log({ databases });
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
      onRefreshClick={onRefreshClick}
      renderItem={({
        item: db,
        onItemClick,
        onDeleteItemClick,
        viewType,
        ...props
      }) => {
        return (
          <NamespaceItemCard
            id={db._id}
            key={db._id}
            name={db.name}
            type="database"
            viewType={viewType}
            status={db.status}
            isNonExistent={db.is_non_existent}
            data={[
              {
                label: 'Storage size',
                value:
                  db.hasDbStats && db.storage_size
                    ? compactBytes(db.storage_size)
                    : 'N/A',
                hint:
                  db.hasDbStats &&
                  db.data_size &&
                  `Uncompressed data size: ${compactBytes(db.data_size)}`,
              },
              {
                label: 'Collections',
                value: db.hasDbStats
                  ? compactNumber(db.collectionsLength)
                  : 'N/A',
                insights:
                  db.collectionsLength >= 10_000
                    ? PerformanceSignals.get('too-many-collections')
                    : undefined,
              },
              {
                label: 'Indexes',
                value:
                  db.hasDbStats && db.index_count
                    ? compactNumber(db.index_count)
                    : 'N/A',
              },
            ]}
            onItemClick={onItemClick}
            onItemDeleteClick={onDeleteItemClick}
            {...props}
          ></NamespaceItemCard>
        );
      }}
      renderLoadSampleDataBanner={renderLoadSampleDataBanner}
    ></ItemsGrid>
  );
};

export { DatabasesList };
