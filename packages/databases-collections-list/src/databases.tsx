/* eslint-disable react/prop-types */
import React from 'react';
import { compactBytes, compactNumber } from './format';
import { ItemsTable } from './items-table';
import type { DatabaseProps } from 'mongodb-database-model';
import { usePreference } from 'compass-preferences-model/provider';
import {
  css,
  cx,
  Icon,
  palette,
  PerformanceSignals,
  SignalPopover,
  spacing,
  Tooltip,
  useDarkMode,
  type LGColumnDef,
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
      accessorKey: 'name',
      header: 'Database name',
      enableSorting: true,
      minSize: 300,
      cell: (info) => {
        const database = info.row.original;
        const name = info.getValue() as string;
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
      accessorKey: 'storage_size',
      header: 'Storage size',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        // TODO: shouldn't this just have the right type rather than unknown?
        const size = info.getValue() as number | undefined;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
    {
      accessorKey: 'data_size',
      header: 'Data size',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        const size = info.getValue() as number | undefined;
        return enableDbAndCollStats && size !== undefined
          ? compactBytes(size)
          : '-';
      },
    },
    {
      accessorKey: 'collectionsLength',
      header: 'Collections',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        const text = enableDbAndCollStats
          ? compactNumber(info.getValue() as number)
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
      accessorKey: 'index_count',
      header: 'Indexes',
      enableSorting: true,
      maxSize: 80,
      cell: (info) => {
        const index_count = info.getValue() as number | undefined;
        return enableDbAndCollStats && index_count !== undefined
          ? compactNumber(index_count)
          : '-';
      },
    },
  ];
}

// TODO: we removed delete click functionality, we removed the header hint functionality
const DatabasesList: React.FunctionComponent<{
  databases: DatabaseProps[];
  onDatabaseClick: (id: string) => void;
  onCreateDatabaseClick?: () => void;
  onRefreshClick?: () => void;
  renderLoadSampleDataBanner?: () => React.ReactNode;
}> = ({
  databases,
  onDatabaseClick,
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
      columns={columns}
      items={databases}
      itemType="database"
      onItemClick={onDatabaseClick}
      onCreateItemClick={onCreateDatabaseClick}
      onRefreshClick={onRefreshClick}
      renderLoadSampleDataBanner={renderLoadSampleDataBanner}
    ></ItemsTable>
  );
};

export { DatabasesList };
