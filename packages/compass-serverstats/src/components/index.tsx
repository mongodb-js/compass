import './index.less';

import React, { useEffect, useRef } from 'react';
import {
  Banner,
  css,
  spacing,
  palette,
  useScrollbars
} from '@mongodb-js/compass-components';

import GraphsComponent from './server-stats-graphs-component';
import { realTimeDispatcher } from '../d3';
import ListsComponent from './server-stats-lists-component';
import { DBErrorComponent } from './dberror-component';
import DBErrorStore from '../stores/dberror-store';
import ServerStatsStore from '../stores/server-stats-graphs-store';
import { ServerStatsToolbar } from './server-stats-toolbar';
import Actions from '../actions';

const REFRESH_STATS_INTERVAL_MS = 1000;

const workspaceContainerStyles = css({
  display: 'flex',
  flexDirection: 'column',
  overflow: 'auto'
});


const workspaceBackgroundStyles = css({
  background: palette.gray.dark2,
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
  marginBottom: 0
});

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

  const { className: scrollbarsClassName } = useScrollbars();

  return (
    <section className={`rt-perf ${scrollbarsClassName}`}>
      <ServerStatsToolbar eventDispatcher={eventDispatcher.current} />
      <div className={workspaceContainerStyles}>
        {ServerStatsStore.isMongos && (
          <Banner className={mongosWarningStyles} variant="warning">
            Top command is not available for mongos, some charts may not show any data.
          </Banner>
        )}
        <DBErrorComponent store={DBErrorStore} />
        <div className={workspaceBackgroundStyles}>
          <div className={workspaceStyles}>
            <section className="rt__graphs-out">
              <GraphsComponent
                eventDispatcher={eventDispatcher.current}
                interval={REFRESH_STATS_INTERVAL_MS}
              />
            </section>
            <section className="rt__lists-out">
              <ListsComponent interval={REFRESH_STATS_INTERVAL_MS} />
            </section>
          </div>
        </div>
      </div>
    </section>
  );
}

export { PerformanceComponent };
