/* eslint-disable react/prop-types */
import React from 'react';
// TODO: don't forget about performance insights?
//import { PerformanceSignals, spacing } from '@mongodb-js/compass-components';
import { compactBytes, compactNumber } from './format';
import { ItemsTable } from './items-table';
import type { DatabaseProps } from 'mongodb-database-model';
import { usePreference } from 'compass-preferences-model/provider';
import { css, type LGColumnDef } from '@mongodb-js/compass-components';

const databaseNameStyles = css({
  wordBreak: 'break-word',
});

function databaseColumns(
  enableDbAndCollStats: boolean
): LGColumnDef<DatabaseProps>[] {
  return [
    {
      accessorKey: 'name',
      header: 'Database name',
      enableSorting: true,
      cell: (info) => {
        const name = info.getValue() as string;
        return <span className={databaseNameStyles}>{name}</span>;
      },
    },
    {
      accessorKey: 'calculated_storage_size',
      header: 'Storage size',
      enableSorting: true,
      cell: (info) => {
        // TODO: shouldn't this just have the right type rather than unknown?
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
      cell: (info) => {
        return enableDbAndCollStats
          ? compactNumber(info.getValue() as number)
          : '-';
      },
    },
    {
      accessorKey: 'index_count',
      header: 'Indexes',
      enableSorting: true,
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
  const enableDbAndCollStats = usePreference('enableDbAndCollStats');
  const columns = React.useMemo(
    () => databaseColumns(enableDbAndCollStats),
    [enableDbAndCollStats]
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
