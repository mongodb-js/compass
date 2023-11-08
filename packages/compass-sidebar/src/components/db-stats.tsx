import React from 'react';

import { connect } from 'react-redux';

import {
  css,
  palette,
  spacing,
  useDarkMode,
  Subtitle,
  Overline,
} from '@mongodb-js/compass-components';
import type { RootState } from '../modules';
import type { Database } from '../modules/databases';

type RefreshingStatus =
  | 'initial'
  | 'fetching'
  | 'refreshing'
  | 'ready'
  | 'error';

const dbStats = css({
  display: 'flex',
  alignItems: 'center',
  padding: `${spacing[5]}px ${spacing[3]}px`,
  gap: spacing[5],
});

const dbStatNumberDark = css({
  color: palette.green.light2,
});

const dbStatNumberLight = css({
  color: palette.green.dark2,
});

const dbStatNameDark = css({
  color: palette.gray.light2,
});

const dbStatNameLight = css({
  color: palette.gray.dark1,
});

function DBStat({ name, stat }: { name: string; stat: string | number }) {
  const darkMode = useDarkMode();

  return (
    <div>
      <Subtitle className={darkMode ? dbStatNumberDark : dbStatNumberLight}>
        {stat}
      </Subtitle>
      <Overline className={darkMode ? dbStatNameDark : dbStatNameLight}>
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

const mapStateToProps = (state: RootState) => ({
  refreshingStatus: state.instance
    ? state.instance.refreshingStatus
    : 'initial',
  databases: state.databases.databases,
});

const MappedDBStats = connect(mapStateToProps, {})(DBStats);

export default MappedDBStats;
