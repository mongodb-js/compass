/* eslint-disable react/prop-types */
import React from 'react';
import { ItemsTable, VirtualItemsTable } from './items-table';
import type { DatabaseProps } from 'mongodb-database-model';
import { usePreference } from 'compass-preferences-model/provider';
import type { LGColumnDef } from '@mongodb-js/compass-components';
import {
  css,
  cx,
  Icon,
  palette,
  PerformanceSignals,
  Placeholder,
  SignalPopover,
  spacing,
  Tooltip,
  useDarkMode,
  compactBytes,
  compactNumber,
  useTranslation,
  type TranslateFn,
} from '@mongodb-js/compass-components';

const databaseNameWrapStyles = css({
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

const collectionsLengthWrapStyles = css({
  display: 'flex',
  gap: spacing[100],
  flexWrap: 'wrap',
  alignItems: 'anchor-center',
});

const collectionsLengthStyles = css({});

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

function databaseColumns({
  t,
  darkMode,
  enableDbAndCollStats,
}: {
  t: TranslateFn;
  darkMode: boolean | undefined;
  enableDbAndCollStats: boolean;
}): LGColumnDef<DatabaseProps>[] {
  return [
    {
      accessorKey: 'name',
      header: t('databasesCollectionsList.databaseName', 'Database name'),
      enableSorting: true,
      sortUndefined: 'last',
      minSize: 300,
      cell: (info) => {
        const database = info.row.original;
        const name = database.name;
        return (
          <span className={databaseNameWrapStyles}>
            <span
              className={cx(
                database.inferred_from_privileges &&
                  !darkMode &&
                  inferredFromPrivilegesLightStyles,
                database.inferred_from_privileges &&
                  darkMode &&
                  inferredFromPrivilegesDarkStyles
              )}
            >
              {name}
            </span>

            {database.inferred_from_privileges && (
              <Tooltip
                align="bottom"
                justify="start"
                trigger={
                  <div className={tooltipTriggerStyles}>
                    <Icon glyph={'InfoWithCircle'} />
                  </div>
                }
              >
                {t(
                  'databasesCollectionsList.inferredFromPrivileges',
                  'Your privileges grant you access to this namespace, but it might not currently exist'
                )}
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'storage_size',
      header: t('databasesCollectionsList.storageSize', 'Storage size'),
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 110,
      cell: (info) => {
        const database = info.row.original;
        if (!isReady(database.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        if (!enableDbAndCollStats || database.storage_size === undefined) {
          return '-';
        }

        return compactBytes(database.storage_size);
      },
    },
    {
      accessorKey: 'data_size',
      header: t('databasesCollectionsList.dataSize', 'Data size'),
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 80,
      cell: (info) => {
        const database = info.row.original;
        if (!isReady(database.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        return enableDbAndCollStats && database.data_size !== undefined
          ? compactBytes(database.data_size)
          : '-';
      },
    },
    {
      accessorKey: 'collectionsLength',
      header: t('databasesCollectionsList.collections', 'Collections'),
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 110,
      cell: (info) => {
        const database = info.row.original;
        if (!isReady(database.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        const text = enableDbAndCollStats
          ? compactNumber(database.collectionsLength)
          : '-';

        return (
          <span className={collectionsLengthWrapStyles}>
            <span className={collectionsLengthStyles}>{text}</span>
            {enableDbAndCollStats && (info.getValue() as number) > 10_000 && (
              <SignalPopover
                signals={PerformanceSignals.get('too-many-collections')}
              ></SignalPopover>
            )}
          </span>
        );
      },
    },
    {
      accessorKey: 'index_count',
      header: t('databasesCollectionsList.indexes', 'Indexes'),
      enableSorting: true,
      sortUndefined: 'last',
      maxSize: 110,
      cell: (info) => {
        const database = info.row.original;
        if (!isReady(database.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        return enableDbAndCollStats && database.index_count !== undefined
          ? compactNumber(database.index_count)
          : '-';
      },
    },
  ];
}

const DatabasesList: React.FunctionComponent<{
  databases: DatabaseProps[];
  onDatabaseClick: (id: string) => void;
  onDeleteDatabaseClick?: (id: string) => void;
  onCreateDatabaseClick?: () => void;
  onRefreshClick?: () => void;
  renderLoadSampleDataBanner?: () => React.ReactNode;
}> = ({
  databases,
  onDatabaseClick,
  onDeleteDatabaseClick,
  onCreateDatabaseClick,
  onRefreshClick,
  renderLoadSampleDataBanner,
}) => {
  let virtual = true;
  if (process.env.COMPASS_DISABLE_VIRTUAL_TABLE_RENDERING === 'true') {
    virtual = false;
  }

  const enableDbAndCollStats = usePreference('enableDbAndCollStats');
  const t = useTranslation();
  const darkMode = useDarkMode();
  const columns = React.useMemo(
    () => databaseColumns({ t, darkMode, enableDbAndCollStats }),
    [t, darkMode, enableDbAndCollStats]
  );

  const TableComponent = virtual ? VirtualItemsTable : ItemsTable;
  return (
    <TableComponent<DatabaseProps>
      virtual={virtual}
      data-testid="databases-list"
      columns={columns}
      items={databases}
      itemType="database"
      onItemClick={onDatabaseClick}
      onDeleteItemClick={onDeleteDatabaseClick}
      onCreateItemClick={onCreateDatabaseClick}
      onRefreshClick={onRefreshClick}
      renderLoadSampleDataBanner={renderLoadSampleDataBanner}
    ></TableComponent>
  );
};

export { DatabasesList };
