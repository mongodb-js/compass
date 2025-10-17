import React, { useCallback } from 'react';
import type { BadgeVariant, GlyphName } from '@mongodb-js/compass-components';
import {
  Badge,
  cx,
  css,
  Icon,
  spacing,
  type LGColumnDef,
  Tooltip,
  palette,
  useDarkMode,
  Placeholder,
  compactBytes,
  compactNumber,
} from '@mongodb-js/compass-components';
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
            {Object.entries(options ?? {}).map(([key, val]) => {
              return (
                val && (
                  <div key={key}>
                    <strong>{key}:</strong>&nbsp;{val.toString()}
                  </div>
                )
              );
            })}
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

function isReady(
  status: 'initial' | 'fetching' | 'refreshing' | 'ready' | 'error'
) {
  /*
  yes:
  * refreshing
  * ready
  * error

  no:
  * initial
  * fetching
  */

  return status !== 'initial' && status !== 'fetching';
}

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
      sortUndefined: 'last',
      minSize: 250,
      cell: (info) => {
        const collection = info.row.original;
        const name = collection.name;

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
          </div>
        );
      },
    },
    {
      header: 'Properties',
      enableSorting: true,
      sortUndefined: 'last',
      cell: (info) => {
        const collection = info.row.original;

        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const badges = collection.properties
          .filter((prop) => prop.id !== 'read-only')
          .map((prop) => {
            return collectionPropertyToBadge(collection, darkMode, prop);
          });

        if (badges.length === 0) {
          return '-';
        }

        return (
          <CollectionBadges>
            {badges.map((badge) => {
              return (
                <CollectionBadge key={badge.id} {...badge}></CollectionBadge>
              );
            })}
          </CollectionBadges>
        );
      },
    },
    {
      accessorKey: 'storage_size',
      header: 'Storage size',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 80,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const type = collection.type as string;
        if (type === 'view') {
          return '-';
        }
        return enableDbAndCollStats && collection.storage_size !== undefined
          ? compactBytes(collection.storage_size)
          : '-';
      },
    },
    /*
    {
      accessorKey: 'free_storage_size',
      header: 'Free storage size',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 100,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const type = collection.type as string;
        if (type === 'view') {
          return '-';
        }
        return enableDbAndCollStats && collection.free_storage_size !== undefined
          ? compactBytes(collection.free_storage_size)
          : '-';
      },
    },
    */
    {
      accessorKey: 'document_count',
      header: 'Documents',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 80,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const type = collection.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        return collection.document_count !== undefined
          ? compactNumber(collection.document_count)
          : '-';
      },
    },
    {
      accessorKey: 'avg_document_size',
      header: 'Avg. document size',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 110,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const type = collection.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        return enableDbAndCollStats &&
          collection.avg_document_size !== undefined
          ? compactBytes(collection.avg_document_size)
          : '-';
      },
    },
    {
      accessorKey: 'index_count',
      header: 'Indexes',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 60,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const type = collection.type as string;
        if (type === 'view' || type === 'timeseries') {
          return '-';
        }

        return enableDbAndCollStats && collection.index_count !== undefined
          ? compactNumber(collection.index_count)
          : '-';
      },
    },
    {
      accessorKey: 'index_size',
      header: 'Total index size',
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 100,
      cell: (info) => {
        const collection = info.row.original;
        if (!isReady(collection.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        if (collection.type === 'view' || collection.type === 'timeseries') {
          return '-';
        }

        const size = collection.index_size;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
  ];
}

const CollectionsList: React.FunctionComponent<{
  namespace: string;
  collections: CollectionProps[];
  onCollectionClick: (id: string) => void;
  onDeleteCollectionClick?: (id: string) => void;
  onCreateCollectionClick?: () => void;
  onRefreshClick?: () => void;
}> = ({
  namespace,
  collections,
  onCollectionClick,
  onDeleteCollectionClick,
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
      data-testid="collections-list"
      namespace={namespace}
      columns={columns}
      items={collections}
      itemType="collection"
      onItemClick={onCollectionClick}
      onDeleteItemClick={onDeleteCollectionClick}
      onCreateItemClick={onCreateCollectionClick}
      onRefreshClick={onRefreshClick}
    ></ItemsTable>
  );
};

export { CollectionsList };
