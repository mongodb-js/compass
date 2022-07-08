/* eslint-disable react/prop-types */
import React, { ComponentProps } from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import type { BadgeProp } from './namespace-card';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';
import { useCollection } from '@mongodb-js/compass-store';

const COLLECTION_CARD_WIDTH = spacing[6] * 4;

const COLLECTION_CARD_HEIGHT = 238;

const COLLECTION_CARD_LIST_HEIGHT = 118;

function collectionPropertyToBadge({
  id,
  options,
}: {
  id: string;
  options?: Record<string, unknown>;
}): BadgeProp {
  switch (id) {
    case 'collation':
      return {
        id,
        name: id,
        variant: 'darkgray',
        hint: (
          <>
            {Object.entries(options ?? {}).map(
              ([key, val]) =>
                val && (
                  <div key={key}>
                    <strong>{key}:</strong>&nbsp;{val}
                  </div>
                )
            )}
          </>
        ),
      };
    case 'view':
      return { id, name: id, variant: 'darkgray', icon: 'Visibility' };
    case 'capped':
      return { id, name: id, variant: 'darkgray' };
    case 'timeseries':
      return { id, name: id, variant: 'darkgray', icon: 'TimeSeries' };
    case 'fle2':
      return {
        id,
        name: 'Queryable Encryption',
        variant: 'darkgray',
        icon: 'Key',
      };
    case 'clustered':
      return { id, name: id, variant: 'darkgray' };
    default:
      return { id, name: id };
  }
}

type Collection = ReturnType<typeof useCollection>;

const CollectionItem: React.FunctionComponent<
  { item: Collection } & Pick<
    ComponentProps<typeof NamespaceItemCard>,
    'onItemClick' | 'onItemDeleteClick' | 'viewType'
  >
> = ({ item: coll, ...props }) => {
  const {
    stats: { data: stats, status: statsStatus },
    info: { data: info, status: infoStatus },
  } = useCollection(coll.name);

  const status =
    statsStatus === 'Fetching' ||
    statsStatus === 'Refreshing' ||
    infoStatus === 'Fetching' ||
    infoStatus === 'Refreshing'
      ? 'fetching'
      : statsStatus === 'Error' || infoStatus === 'Error'
      ? 'error'
      : 'ready';

  const data =
    coll.type === 'view'
      ? [{ label: 'View on', value: info?.viewOn }]
      : [
          {
            label: 'Storage size',
            value: stats
              ? compactBytes(stats.storageSize - stats.freeStorageSize)
              : 0,
            hint: `Uncompressed data size: ${
              stats ? compactBytes(stats.size) : 0
            }`,
          },
          {
            label: 'Documents',
            value: stats ? compactNumber(stats.documentCount) : 0,
          },
          {
            label: 'Avg. document size',
            value: stats ? compactBytes(stats.avgDocumentSize) : 0,
          },
          {
            label: 'Indexes',
            value: stats ? compactNumber(stats.indexCount) : 0,
          },
          {
            label: 'Total index size',
            value: stats ? compactBytes(stats.indexSize) : 0,
          },
        ];

  // const badges = coll.properties.map((prop) => {
  //   return collectionPropertyToBadge(prop);
  // });
  const badges: [] = [];

  return (
    <NamespaceItemCard
      id={coll.name}
      key={coll.name}
      name={coll.name}
      type="collection"
      status={status}
      data={data}
      badges={badges}
      {...props}
    ></NamespaceItemCard>
  );
};

const CollectionsList: React.FunctionComponent<{
  collections: Collection[];
  onCollectionClick(id: string): void;
  onDeleteCollectionClick?: (id: string) => void;
  onCreateCollectionClick?: () => void;
}> = ({
  collections,
  onCollectionClick,
  onCreateCollectionClick,
  onDeleteCollectionClick,
}) => {
  return (
    <ItemsGrid
      items={collections}
      itemType="collection"
      itemGridWidth={COLLECTION_CARD_WIDTH}
      itemGridHeight={COLLECTION_CARD_HEIGHT}
      itemListHeight={COLLECTION_CARD_LIST_HEIGHT}
      sortBy={[
        { name: 'name', label: 'Collection Name' },
        { name: 'document_count', label: 'Documents' },
        { name: 'avg_document_size', label: 'Avg. document size' },
        { name: 'storage_size', label: 'Storage size' },
        { name: 'index_count', label: 'Indexes' },
        { name: 'index_size', label: 'Total index size' },
      ]}
      onItemClick={onCollectionClick}
      onDeleteItemClick={onDeleteCollectionClick}
      onCreateItemClick={onCreateCollectionClick}
      renderItem={CollectionItem}
    ></ItemsGrid>
  );
};

export { CollectionsList };
