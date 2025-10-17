/* eslint-disable react/prop-types */
import React from 'react';
import { ItemsTable } from './items-table';
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
  darkMode,
  enableDbAndCollStats,
  showInsights,
}: {
  darkMode: boolean | undefined;
  enableDbAndCollStats: boolean;
  showInsights?: boolean;
}): LGColumnDef<DatabaseProps>[] {
  return [
    {
      header: 'Database name',
      enableSorting: true,
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
                Your privileges grant you access to this namespace, but it might
                not currently exist
              </Tooltip>
            )}
          </span>
        );
      },
    },
    {
      header: 'Storage size',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        const database = info.row.original;
        if (!isReady(database.status)) {
          return <Placeholder maxChar={10}></Placeholder>;
        }

        // TODO: shouldn't this just have the right type rather than unknown?
        return enableDbAndCollStats && database.storage_size !== undefined
          ? compactBytes(database.storage_size)
          : '-';
      },
    },
    /*
    {
      header: 'Data size',
      enableSorting: true,
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
    */
    {
      header: 'Collections',
      enableSorting: true,
      maxSize: 80,
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
            {showInsights &&
              enableDbAndCollStats &&
              (info.getValue() as number) > 10_000 && (
                <SignalPopover
                  signals={PerformanceSignals.get('too-many-collections')}
                ></SignalPopover>
              )}
          </span>
        );
      },
    },
    {
      header: 'Indexes',
      enableSorting: true,
      maxSize: 80,
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

// TODO: we removed delete click functionality, we removed the header hint functionality
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
  const showInsights = usePreference('showInsights');
  const enableDbAndCollStats = usePreference('enableDbAndCollStats');
  const darkMode = useDarkMode();
  const columns = React.useMemo(
    () => databaseColumns({ darkMode, enableDbAndCollStats, showInsights }),
    [darkMode, enableDbAndCollStats, showInsights]
  );
  return (
    <ItemsTable
      data-testid="databases-list"
      columns={columns}
      items={databases}
      itemType="database"
      onItemClick={onDatabaseClick}
      onDeleteItemClick={onDeleteDatabaseClick}
      onCreateItemClick={onCreateDatabaseClick}
      onRefreshClick={onRefreshClick}
      renderLoadSampleDataBanner={renderLoadSampleDataBanner}
    ></ItemsTable>
  );
};

export { DatabasesList };
