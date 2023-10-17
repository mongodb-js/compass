import './index.less';

import React, { useEffect, useRef, useState } from 'react';
import {
  Banner,
  LeafyGreenProvider,
  css,
  cx,
  spacing,
  palette,
  useScrollbars,
} from '@mongodb-js/compass-components';

import GraphsComponent from './server-stats-graphs-component';
import { realTimeDispatcher } from '../d3';
import ListsComponent from './server-stats-lists-component';
import { DBErrorComponent } from './dberror-component';
import DBErrorStore from '../stores/dberror-store';
import ServerStatsStore from '../stores/server-stats-graphs-store';
import TopStore from '../stores/top-store';
import { ServerStatsToolbar } from './server-stats-toolbar';
import Actions from '../actions';
import type { TimeScrubEventDispatcher } from './server-stats-toolbar';

const REFRESH_STATS_INTERVAL_MS = 1000;

const workspaceContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto',
});

const workspaceBackgroundStyles = css({
  background: palette.black,
  overflow: 'hidden',
});

const workspaceStyles = css({
  padding: spacing[4],
  marginBottom: spacing[6],
  display: 'flex',
  flexWrap: 'wrap',
  justifyContent: 'space-around',
  flexGrow: 1,
  overflow: 'auto',
  minHeight: 0,
  height: '100%',
});

const mongosWarningStyles = css({
  margin: spacing[2],
  marginBottom: 0,
});

function PerformancePanel({
  eventDispatcher,
}: {
  eventDispatcher: TimeScrubEventDispatcher;
}) {
  return (
    <div>
      <DBErrorComponent store={DBErrorStore} />
      <div className={workspaceBackgroundStyles}>
        <div className={workspaceStyles}>
          <section className="rt__graphs-out">
            <GraphsComponent
              eventDispatcher={eventDispatcher}
              interval={REFRESH_STATS_INTERVAL_MS}
            />
          </section>
          <section className="rt__lists-out">
            <ListsComponent interval={REFRESH_STATS_INTERVAL_MS} />
          </section>
        </div>
      </div>
    </div>
  );
}

function PerformancePanelMsgs() {
  const [, forceUpdate] = useState({});

  useEffect(() => {
    // Trigger the component refresh when stores are updated.
    ServerStatsStore.listen(() => {
      forceUpdate({});
    }, ServerStatsStore);
    TopStore.listen(() => {
      forceUpdate({});
    }, TopStore);
  }, []);

  return (
    <div>
      {(ServerStatsStore as any).isMongos && (
        <Banner className={mongosWarningStyles} variant="warning">
          Top command is not available for mongos, some charts may not show any
          data.
        </Banner>
      )}
      {(TopStore as any).topUnableToRetrieveSomeCollections && (
        <Banner className={mongosWarningStyles} variant="warning">
          Top command is unable to retrieve information about certain
          collections, resulting in incomplete data being displayed on the
          charts.
        </Banner>
      )}
    </div>
  );
}

/**
 * Renders the entire performance tab, including charts and lists.
 */
function PerformanceComponent() {
  const eventDispatcher = useRef(realTimeDispatcher());

  useEffect(() => {
    return () => {
      // Reset the store on unmount so that when this is remounted
      // the errors and previous state are reset.
      Actions.restart();
    };
  }, []);

  const { className: scrollbarStyles } = useScrollbars();

  return (
    <section className="rt-perf">
      <ServerStatsToolbar eventDispatcher={eventDispatcher.current} />
      <LeafyGreenProvider darkMode>
        <div className={cx(workspaceContainerStyles, scrollbarStyles)}>
          <PerformancePanelMsgs />
          <PerformancePanel eventDispatcher={eventDispatcher.current} />
        </div>
      </LeafyGreenProvider>
    </section>
  );
}

export { PerformanceComponent };
