/* eslint-disable react/prop-types */
import React from 'react';
import { spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import type { BadgeProp } from './namespace-card';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';

type Collection = {
  _id: string;
  name: string;
  type: string;
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error';
  document_count: number;
  document_size: number;
  avg_document_size: number;
  storage_size: number;
  free_storage_size: number;
  index_count: number;
  index_size: number;
  properties: { id: string }[];
  source?: Collection;
};

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

const CollectionsList: React.FunctionComponent<{
  collections: Collection[];
  onCollectionClick(id: string): void;
  onDeleteCollectionClick?: (id: string) => void;
  onCreateCollectionClick?: () => void;
  onRefreshClick?: () => void;
}> = ({
  collections,
  onCollectionClick,
  onCreateCollectionClick,
  onDeleteCollectionClick,
  onRefreshClick,
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
      onRefreshClick={onRefreshClick}
      renderItem={({
        item: coll,
        onItemClick,
        onDeleteItemClick,
        ...props
      }) => {
        const data =
          coll.type === 'view'
            ? [{ label: 'View on', value: coll.source?.name }]
            : [
                {
                  label: 'Storage size',
                  value: compactBytes(
                    coll.storage_size - coll.free_storage_size
                  ),
                  hint: `Uncompressed data size: ${compactBytes(
                    coll.document_size
                  )}`,
                },
                {
                  label: 'Documents',
                  value: compactNumber(coll.document_count),
                },
                {
                  label: 'Avg. document size',
                  value: compactBytes(coll.avg_document_size),
                },
                {
                  label: 'Indexes',
                  value: compactNumber(coll.index_count),
                },
                {
                  label: 'Total index size',
                  value: compactBytes(coll.index_size),
                },
              ];

        const badges = coll.properties.map((prop) => {
          return collectionPropertyToBadge(prop);
        });

        return (
          <NamespaceItemCard
            id={coll._id}
            key={coll._id}
            name={coll.name}
            type="collection"
            status={coll.status}
            data={data}
            badges={badges}
            onItemClick={onItemClick}
            onItemDeleteClick={onDeleteItemClick}
            {...props}
          ></NamespaceItemCard>
        );
      }}
    ></ItemsGrid>
  );
};

export { CollectionsList };
