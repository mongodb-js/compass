import type AppRegistry from 'hadron-app-registry';
import store from './stores/index';
import Component from './components/index';

const role = {
  component: Component,
  name: 'My Queries',
  order: 1,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerStore('App.AggregationsQueriesListStore', store);
  appRegistry.registerRole('Instance.Tab', role);
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterStore('App.AggregationsQueriesListStore');
  appRegistry.deregisterRole('Instance.Tab', role);
}

export { activate, deactivate };

export { default as metadata } from '../package.json';
