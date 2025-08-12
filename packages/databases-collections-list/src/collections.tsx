import React from 'react';
import { css, spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import type { BadgeProp } from './namespace-card';
import { NamespaceItemCard } from './namespace-card';
import { ItemsGrid } from './items-grid';
import type { CollectionProps } from 'mongodb-collection-model';
import { usePreference } from 'compass-preferences-model/provider';

const COLLECTION_CARD_WIDTH = spacing[1600] * 4;

const COLLECTION_CARD_HEIGHT = 238;
const COLLECTION_CARD_WITHOUT_STATS_HEIGHT = COLLECTION_CARD_HEIGHT - 150;

const COLLECTION_CARD_LIST_HEIGHT = 118;
const COLLECTION_CARD_LIST_WITHOUT_STATS_HEIGHT =
  COLLECTION_CARD_LIST_HEIGHT - 50;

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

const pageContainerStyles = css({
  height: 'auto',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const CollectionsList: React.FunctionComponent<{
  namespace: string;
  collections: CollectionProps[];
  onCollectionClick(id: string): void;
  onDeleteCollectionClick?: (id: string) => void;
  onCreateCollectionClick?: () => void;
  onRefreshClick?: () => void;
}> = ({
  namespace,
  collections,
  onCollectionClick,
  onCreateCollectionClick,
  onDeleteCollectionClick,
  onRefreshClick,
}) => {
  const enableDbAndCollStats = usePreference('enableDbAndCollStats');
  return (
    <div className={pageContainerStyles}>
      <ItemsGrid
        namespace={namespace}
        items={collections}
        itemType="collection"
        itemGridWidth={COLLECTION_CARD_WIDTH}
        itemGridHeight={
          enableDbAndCollStats
            ? COLLECTION_CARD_HEIGHT
            : COLLECTION_CARD_WITHOUT_STATS_HEIGHT
        }
        itemListHeight={
          enableDbAndCollStats
            ? COLLECTION_CARD_LIST_HEIGHT
            : COLLECTION_CARD_LIST_WITHOUT_STATS_HEIGHT
        }
        sortBy={[
          { name: 'name', label: 'Collection Name' },
          { name: 'document_count', label: 'Documents' },
          { name: 'avg_document_size', label: 'Avg. document size' },
          { name: 'calculated_storage_size', label: 'Storage size' },
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
              : coll.type === 'timeseries'
              ? [
                  {
                    label: 'Storage size',
                    value:
                      coll.calculated_storage_size !== undefined
                        ? compactBytes(coll.calculated_storage_size)
                        : 'N/A',
                    hint:
                      coll.document_size !== undefined &&
                      `Uncompressed data size: ${compactBytes(
                        coll.document_size
                      )}`,
                  },
                ]
              : [
                  {
                    label: 'Storage size',
                    value:
                      coll.calculated_storage_size !== undefined
                        ? compactBytes(coll.calculated_storage_size)
                        : 'N/A',
                    hint:
                      coll.document_size !== undefined &&
                      `Uncompressed data size: ${compactBytes(
                        coll.document_size
                      )}`,
                  },
                  {
                    label: 'Documents',
                    value:
                      coll.document_count !== undefined
                        ? compactNumber(coll.document_count)
                        : 'N/A',
                  },
                  {
                    label: 'Avg. document size',
                    value:
                      coll.avg_document_size !== undefined
                        ? compactBytes(coll.avg_document_size)
                        : 'N/A',
                  },
                  {
                    label: 'Indexes',
                    value:
                      coll.index_count !== undefined
                        ? compactNumber(coll.index_count)
                        : 'N/A',
                  },
                  {
                    label: 'Total index size',
                    value:
                      coll.index_size !== undefined
                        ? compactBytes(coll.index_size)
                        : 'N/A',
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
              inferredFromPrivileges={coll.inferred_from_privileges}
              data={data}
              badges={badges}
              onItemClick={onItemClick}
              onItemDeleteClick={onDeleteItemClick}
              {...props}
            ></NamespaceItemCard>
          );
        }}
      ></ItemsGrid>
    </div>
  );
};

export { CollectionsList };
