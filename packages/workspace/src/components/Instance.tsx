import React, { useState } from 'react';
import { TabNavBar } from 'hadron-react-components';
import { DatabasesPlugin, createDatabasesStore } from '@mongodb-js/compass-databases-collections';
import { PerformanceComponent } from '@mongodb-js/compass-serverstats';

import { Namespace } from './types';
import ErrorBoundary from './ErrorBoundary';

type Props = {
  isDataLake: boolean;
  updateNamespace: (ns: Namespace) => void;
};

/**
 * Represents the instance view.
 */
function InstanceComponent({
  isDataLake,
  updateNamespace
}: Props) {

  const [activeTab, setActiveTab] = useState(0);

  const [databasesPluginStore] = useState(
    createDatabasesStore
  );

  const tabs = ['Databases'];
  const views = [
    <ErrorBoundary>
      <DatabasesPlugin store={databasesPluginStore} />
    </ErrorBoundary>
  ];

  if (!isDataLake) {
    tabs.push('Performance')
    views.push(
      <ErrorBoundary>
        <PerformanceComponent />
      </ErrorBoundary>
    );
  }

  return (
    <TabNavBar
      aria-label="Instance Tabs"
      tabs={tabs}
      views={views}
      activeTabIndex={activeTab}
      onTabClicked={setActiveTab}
      mountAllViews={false}
    />
  );

  // onTabClicked(idx, name) {
  //   if (this.state.activeTab === idx) {
  //     return;
  //   }
  //   global.hadronApp.appRegistry.emit('compass:screen:viewed', { screen: name });
  //   this.setState({ activeTab: idx });
  // }
}

InstanceComponent.displayName = 'InstanceComponent';

export default InstanceComponent;
