import { createStore } from 'redux';
import reducer from '../modules';
// import { setupRuntime } from '../modules/runtime';
// import {
//   globalAppRegistryActivated
// } from '@mongodb-js/mongodb-redux-common/app-registry';

// const debug = require('debug')('mongodb-compass-shell:store');

export default class CompassShellStore {
  constructor() {
    this.reduxStore = createStore(reducer);
  }

  // globalAppRegistry = null;

  // onActivated(appRegistry) {
  //   debug('activated');

  //   this.globalAppRegistry = appRegistry;

  //   appRegistry.on(
  //     'data-service-connected',
  //     this.onDataServiceConnected
  //   );

  //   appRegistry.on(
  //     'data-service-disconnected',
  //     this.onDataServiceDisconnected
  //   );

  //   // Set the global app registry in the store.
  //   this.reduxStore.dispatch(globalAppRegistryActivated(appRegistry));
  // }

  // onDataServiceConnected = (error, dataService) => {
  //   console.log('data service connected');
  //   this.reduxStore.dispatch(setupRuntime(
  //     error,
  //     dataService,
  //     this.globalAppRegistry
  //   ));
  // }

  // onDataServiceDisconnected = () => {
  //   const {
  //     runtime: { runtime },
  //   } = this.reduxStore.getState();

  //   if (runtime) {
  //     runtime.terminate();
  //   }

  //   this.reduxStore.dispatch(setupRuntime(
  //     null,
  //     null,
  //     null
  //   ));
  // }
}
