import React from 'react';
import { PerformanceComponent } from './components';
import { registerHadronPlugin } from 'hadron-app-registry';
import {
  dataServiceLocator,
  type DataServiceLocator,
  type DataService,
} from '@mongodb-js/compass-connections/provider';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';
import CurrentOpStore from './stores/current-op-store';
import ServerStatsStore from './stores/server-stats-graphs-store';
import TopStore from './stores/top-store';
import type { WorkspacePlugin } from '@mongodb-js/compass-workspaces';
import { WorkspaceName, ServerStatsPluginTitle } from './plugin-tab-title';

type PerformancePluginInitialProps = {};

const WorkspaceTab: WorkspacePlugin<typeof WorkspaceName> = {
  name: WorkspaceName,
  provider: registerHadronPlugin(
    {
      name: WorkspaceName,
      component: function PerformanceProvider({ children }) {
        return React.createElement(React.Fragment, null, children);
      },
      activate(
        _initialProps: PerformancePluginInitialProps,
        { dataService, instance }
      ) {
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
  ),
  content: PerformanceComponent,
  header: ServerStatsPluginTitle,
};

export { WorkspaceTab };
export { default as d3 } from './d3';
