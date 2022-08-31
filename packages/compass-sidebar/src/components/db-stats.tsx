import React from 'react';

import { connect } from 'react-redux';

import {
  css,
  uiColors,
  spacing,
  useTheme,
  Theme,
  Subtitle,
  Overline,
} from '@mongodb-js/compass-components';
import type { MongoDBInstance } from 'mongodb-instance-model';

type RefreshingStatus =
  | 'initial'
  | 'fetching'
  | 'refreshing'
  | 'ready'
  | 'error';

type Collection = {
  id: string;
  name: string;
  type: string;
};

type Database = {
  _id: string;
  name: string;
  collectionsStatus: string;
  collectionsLength: number;
  collections: Collection[];
};

const dbStats = css({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing[5]}px ${spacing[3]}px`,
  gap: spacing[5],
});

const dbStatNumberDark = css({
  color: uiColors.green.base,
});

const dbStatNumberLight = css({
  color: uiColors.green.dark2,
});

const dbStatNameDark = css({
  color: uiColors.gray.light2,
});

const dbStatNameLight = css({
  color: uiColors.gray.dark1,
});

function DBStat({ name, stat }: { name: string; stat: string | number }) {
  const { theme } = useTheme();

  return (
    <div>
      <Subtitle
        className={theme === Theme.Dark ? dbStatNumberDark : dbStatNumberLight}
      >
        {stat}
      </Subtitle>
      <Overline
        className={theme === Theme.Dark ? dbStatNameDark : dbStatNameLight}
      >
        {name}
      </Overline>
    </div>
  );
}

export function DBStats({
  refreshingStatus,
  databases,
}: {
  refreshingStatus: RefreshingStatus;
  databases: Database[];
}) {
  const isReady = refreshingStatus === 'ready';

  const numDbs = isReady ? databases.length : '-';
  const numCollections = isReady
    ? databases.map((db) => db.collectionsLength).reduce((acc, n) => acc + n, 0)
    : '-';

  return (
    <div className={dbStats}>
      <DBStat name="DBs" stat={numDbs} />
      <DBStat name="Collections" stat={numCollections} />
    </div>
  );
}

const mapStateToProps = (state: {
  instance?: MongoDBInstance;
  databases: {
    databases: Database[];
  };
}) => ({
  refreshingStatus: state.instance
    ? state.instance.refreshingStatus
    : 'initial',
  databases: state.databases.databases,
});

const MappedDBStats = connect(mapStateToProps, {})(DBStats);

export default MappedDBStats;
