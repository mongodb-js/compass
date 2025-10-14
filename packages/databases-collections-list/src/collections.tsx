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
  palette,
  useDarkMode,
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

const collectionBadgesStyles = css({
  display: 'flex',
  gap: spacing[200],
  // Preserving space for when cards with and without badges are mixed in a
  // single row
  minHeight: 20,
});

const CollectionBadges: React.FunctionComponent = ({ children }) => {
  return <div className={collectionBadgesStyles}>{children}</div>;
};

const collectionBadgeStyles = css({
  gap: spacing[100],
});

const viewOnStyles = css({
  fontWeight: 'bold',
});

const viewOnLightStyles = css({
  color: palette.white,
});

const viewOnDarkStyles = css({
  color: palette.black,
});

const CollectionBadge: React.FunctionComponent<BadgeProp> = ({
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
          className={cx(collectionBadgeStyles, className)}
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

function collectionPropertyToBadge(
  collection: CollectionProps,
  darkMode: boolean | undefined,
  {
    id,
    options,
  }: {
    id: string;
    options?: Record<string, unknown>;
  }
): BadgeProp {
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
      return {
        id,
        name: id,
        variant: 'darkgray',
        icon: 'Visibility',
        hint: (
          <>
            Derived from{' '}
            <span
              className={cx(
                viewOnStyles,
                darkMode ? viewOnDarkStyles : viewOnLightStyles
              )}
            >
              {collection.view_on}
            </span>
          </>
        ),
      };
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

const collectionNameWrapStyles = css({
  display: 'flex',
  gap: spacing[100],
  flexWrap: 'wrap',
  alignItems: 'anchor-center',
  wordBreak: 'break-word',
});

const tooltipTriggerStyles = css({
  display: 'flex',
});

const inferredFromPrivilegesLightStyles = css({
  color: palette.gray.dark1,
});

const inferredFromPrivilegesDarkStyles = css({
  color: palette.gray.base,
});

function collectionColumns({
  darkMode,
  enableDbAndCollStats,
}: {
  darkMode: boolean | undefined;
  enableDbAndCollStats: boolean;
}): LGColumnDef<CollectionProps>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Collection name',
      enableSorting: true,
      minSize: 250,
      cell: (info) => {
        const collection = info.row.original;
        const name = info.getValue() as string;

        const badges = collection.properties
          .filter((prop) => prop.id !== 'read-only')
          .map((prop) => {
            return collectionPropertyToBadge(collection, darkMode, prop);
          });

        return (
          <div className={collectionNameWrapStyles}>
            <span
              className={cx(
                collection.inferred_from_privileges &&
                  !darkMode &&
                  inferredFromPrivilegesLightStyles,
                collection.inferred_from_privileges &&
                  darkMode &&
                  inferredFromPrivilegesDarkStyles
              )}
            >
              {name}
            </span>
            {collection.inferred_from_privileges && (
              <Tooltip
                align="bottom"
                justify="start"
                trigger={
                  <div className={tooltipTriggerStyles}>
                    <Icon glyph={'InfoWithCircle'} />
                  </div>
                }
              >
                Your privileges grant you access to this namespace, but it might
                not currently exist
              </Tooltip>
            )}
            <CollectionBadges>
              {badges.map((badge) => {
                return (
                  <CollectionBadge key={badge.id} {...badge}></CollectionBadge>
                );
              })}
            </CollectionBadges>
          </div>
        );
      },
    },
    {
      accessorKey: 'storage_size',
      header: 'Storage size',
      enableSorting: true,
      maxSize: 80,
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
    /*
    {
      accessorKey: 'free_storage_size',
      header: 'Free storage size',
      enableSorting: true,
      maxSize: 100,
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
    */
    {
      accessorKey: 'document_count',
      header: 'Documents',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        const type = info.row.original.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        const count = info.getValue() as number | undefined;
        return count !== undefined ? compactNumber(count) : '-';
      },
    },
    {
      accessorKey: 'avg_document_size',
      header: 'Avg. document size',
      enableSorting: true,
      maxSize: 110,
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
      maxSize: 60,
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
      maxSize: 100,
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
  const darkMode = useDarkMode();
  const columns = React.useMemo(
    () => collectionColumns({ darkMode, enableDbAndCollStats }),
    [darkMode, enableDbAndCollStats]
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
