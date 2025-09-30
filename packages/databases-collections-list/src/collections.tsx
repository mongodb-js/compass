import React, { useCallback } from 'react';
import {
  Badge,
  type BadgeVariant,
  cx,
  css,
  type GlyphName,
  Icon,
  spacing,
  type LGColumnDef,
  Tooltip,
} from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import { ItemsTable } from './items-table';
import type { CollectionProps } from 'mongodb-collection-model';
import { usePreference } from 'compass-preferences-model/provider';

type BadgeProp = {
  id: string;
  name: string;
  variant?: BadgeVariant;
  icon?: GlyphName;
  hint?: React.ReactNode;
};

const cardBadgesStyles = css({
  display: 'flex',
  gap: spacing[200],
  // Preserving space for when cards with and without badges are mixed in a
  // single row
  minHeight: 20,
});

const CardBadges: React.FunctionComponent = ({ children }) => {
  return <div className={cardBadgesStyles}>{children}</div>;
};

const cardBadgeStyles = css({
  gap: spacing[100],
});

const CardBadge: React.FunctionComponent<BadgeProp> = ({
  id,
  name,
  icon,
  variant,
  hint,
}) => {
  const badge = useCallback(
    ({ className, children, ...props } = {}) => {
      return (
        <Badge
          data-testid={`collection-badge-${id}`}
          className={cx(cardBadgeStyles, className)}
          variant={variant}
          {...props}
        >
          {icon && <Icon size="small" glyph={icon}></Icon>}
          <span>{name}</span>
          {/* Tooltip will be rendered here */}
          {children}
        </Badge>
      );
    },
    [id, icon, name, variant]
  );

  if (hint) {
    return <Tooltip trigger={badge}>{hint}</Tooltip>;
  }

  return badge();
};

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

const collectionNameStyles = css({
  display: 'flex',
  gap: spacing[100],
  flexWrap: 'wrap',
  alignItems: 'anchor-center',
});

function collectionColumns(
  enableDbAndCollStats: boolean
): LGColumnDef<CollectionProps>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Collection name',
      enableSorting: true,
      size: 300,
      cell: (info) => {
        const name = info.getValue() as string;

        const badges = info.row.original.properties
          .filter((prop) => prop.id !== 'read-only')
          .map((prop) => {
            return collectionPropertyToBadge(prop);
          });

        return (
          <div className={collectionNameStyles}>
            <span>{name}</span>
            <CardBadges>
              {badges.map((badge) => {
                return <CardBadge key={badge.id} {...badge}></CardBadge>;
              })}
            </CardBadges>
          </div>
        );
      },
    },
    {
      accessorKey: 'calculated_storage_size',
      header: 'Storage size',
      enableSorting: true,
      cell: (info) => {
        const type = info.row.original.type as string;
        if (type === 'view') {
          return '-';
        }
        const size = info.getValue() as number | undefined;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
    {
      accessorKey: 'avg_document_size',
      header: 'Avg. document size',
      enableSorting: true,
      cell: (info) => {
        const type = info.row.original.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        const size = info.getValue() as number | undefined;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
    {
      accessorKey: 'Indexes',
      header: 'Indexes',
      enableSorting: true,
      cell: (info) => {
        const type = info.row.original.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        const index_count = info.getValue() as number | undefined;
        return enableDbAndCollStats && index_count !== undefined
          ? compactNumber(index_count)
          : '-';
      },
    },
    {
      accessorKey: 'index_size',
      header: 'Total index size',
      enableSorting: true,
      cell: (info) => {
        const type = info.row.original.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        const size = info.getValue() as number | undefined;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
  ];
}

// TODO: we removed delete click functionality, we removed the header hint functionality
const CollectionsList: React.FunctionComponent<{
  namespace: string;
  collections: CollectionProps[];
  onCollectionClick: (id: string) => void;
  onCreateCollectionClick?: () => void;
  onRefreshClick?: () => void;
}> = ({
  namespace,
  collections,
  onCollectionClick,
  onCreateCollectionClick,
  onRefreshClick,
}) => {
  const enableDbAndCollStats = usePreference('enableDbAndCollStats');
  const columns = React.useMemo(
    () => collectionColumns(enableDbAndCollStats),
    [enableDbAndCollStats]
  );
  return (
    <ItemsTable
      namespace={namespace}
      columns={columns}
      items={collections}
      itemType="collection"
      onItemClick={onCollectionClick}
      onCreateItemClick={onCreateCollectionClick}
      onRefreshClick={onRefreshClick}
    ></ItemsTable>
  );
};

export { CollectionsList };
