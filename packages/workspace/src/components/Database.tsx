import React, { useState } from 'react';
import { TabNavBar } from 'hadron-react-components';
// import { DatabasesPlugin, createDatabasesStore } from '@mongodb-js/compass-databases-collections';
// const { PerformanceComponent } = require('@mongodb-js/compass-serverstats');

import { Namespace } from './types';
import ErrorBoundary from './ErrorBoundary';

type Props = {
  databaseName: string;
  updateNamespace: (ns: Namespace) => void;
};

/**
 * Represents the instance view.
 */
function DatabaseComponent({
  databaseName,
  updateNamespace
}: Props) {

  const [activeTab, setActiveTab] = useState(0);

  // // console.log('DatabasesPlugin', DatabasesPlugin);

  // const createDatabasesStore = (global as any).hadronApp.appRegistry.getRole(
  //   'Instance.Databases.Tab'
  // )[0].createStore;

  // const [databasesPluginStore, setDatabasesPluginStore] = useState(
  //   createDatabasesStore(
  //     (global as any).hadronApp.appRegistry,
  //     (global as any).hadronApp.appRegistry.stores[
  //       'App.InstanceStore'
  //     ].getState()
  //   )
  // );

  // (global as any).hadronApp.appRegistry.on('instance-refreshed', (state: any) => {
  //   // TODO: This is a very leaky event listener.
  //   // setDatabasesPluginStore(
  //   //   createDatabasesStore(
  //   //     (global as any).hadronApp.appRegistry,
  //   //     (global as any).hadronApp.appRegistry.stores[
  //   //       'App.InstanceStore'
  //   //     ].getState()
  //   //   )
  //   // );
  //   // databasesPluginStore.dispatch();
  //   console.log('\n\n\ninstance-refreshe');
  //   databasesPluginStore.loadInstance(state.instance);
  // });
    // .stores['App.InstanceStore'].getState();

  // const tabs = ['Databases'];
  // const views = [
  //   <ErrorBoundary>
  //     <DatabasesPlugin store={databasesPluginStore} />
  //   </ErrorBoundary>
  // ];

  // if (!isDataLake) {
  //   tabs.push('Performance')
  //   views.push(
  //     <ErrorBoundary>
  //       <PerformanceComponent />
  //     </ErrorBoundary>
  //   );
  // }

  // global.hadronApp.appRegistry.getRole(name)

  const DatabaseComponent = (global as any).hadronApp.appRegistry.getRole(
    'Database.Workspace'
  )[0].component;
  // const DatabasesStore = 
  // const PerformanceComponent = (global as any).hadronApp.appRegistry.getRole(
  //   'Instance.Tab'
  // )[0].component;

  const tabs = ['Collections'];
  const views = [
    <ErrorBoundary>
      <DatabaseComponent
        // store={databasesPluginStore}
        databaseName={databaseName}
        updateNamespace={updateNamespace}
      />
    </ErrorBoundary>
  ];

  // if (!isDataLake) {
  //   tabs.push('Performance')
  //   views.push(
  //     <ErrorBoundary>
  //       <PerformanceComponent />
  //     </ErrorBoundary>
  //   );
  // }

  // const tabs = ['Databases'];
  // const views = [
  //   <ErrorBoundary>
  //     <div>aaa</div>
  //   </ErrorBoundary>
  // ];

  // if (!isDataLake) {
  //   tabs.push('Performance')
  //   views.push(
  //     <ErrorBoundary>
  //       <div>bbbb</div>
  //     </ErrorBoundary>
  //   );
  // }

  return (
    <TabNavBar
      aria-label="Database Tabs"
      tabs={tabs}
      views={views}
      activeTabIndex={activeTab}
      onTabClicked={setActiveTab}
      mountAllViews={false}
    />
    // <div>
    //   aaaaa
    // </div>
  );

  // onTabClicked(idx, name) {
  //   if (this.state.activeTab === idx) {
  //     return;
  //   }
  //   global.hadronApp.appRegistry.emit('compass:screen:viewed', { screen: name });
  //   this.setState({ activeTab: idx });
  // }
}

DatabaseComponent.displayName = 'DatabaseComponent';

export default DatabaseComponent;
