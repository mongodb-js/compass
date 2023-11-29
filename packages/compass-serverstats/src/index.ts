import { PerformanceComponent } from './components';
import { registerHadronPlugin } from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';
import {
  dataServiceLocator,
  type DataServiceLocator,
} from 'mongodb-data-service/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import CurrentOpStore from './stores/current-op-store';
import ServerStatsStore from './stores/server-stats-graphs-store';
import TopStore from './stores/top-store';

const PerformancePlugin = registerHadronPlugin(
  {
    name: 'Performance',
    component: PerformanceComponent,
    activate(_initialProps: Record<string, never>, { dataService, instance }) {
      CurrentOpStore.onActivated(dataService);
      ServerStatsStore.onActivated(dataService);
      TopStore.onActivated(dataService, instance);

      // TODO(COMPASS-7416): no stores or subscriptions are returned here, we'd
      // need to refactor the stores of this package
      return {
        store: {},
        deactivate() {
          // noop
        },
      };
    },
  },
  {
    dataService: dataServiceLocator as DataServiceLocator<keyof DataService>,
    instance: mongoDBInstanceLocator,
  }
);

const WorkspaceTab = {
  name: 'Performance' as const,
  component: PerformancePlugin,
};

export type ServerStatsWorkspace = {
  type: typeof WorkspaceTab['name'];
} & React.ComponentProps<typeof WorkspaceTab['component']>;

/**
 * Activate all the components in the RTSS package.
 */
function activate() {
  // noop
}

/**
 * Deactivate all the components in the RTSS package.
 */
function deactivate() {
  // noop
}

export default PerformancePlugin;
export { activate, deactivate, WorkspaceTab };
export { default as d3 } from './d3';
export { default as metadata } from '../package.json';
