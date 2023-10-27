import type AppRegistry from 'hadron-app-registry';
import Component from './components';
import configureStore, { getStore } from './stores';

const role = {
  component: Component,
  name: 'Schema',
  order: 2,
  configureStore,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Database.Tab', role);
  appRegistry.registerStore(
    'DatabaseSchema.DatabaseSchemaStore',
    getStore() as any
  );
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Database.Tab', role);
  appRegistry.deregisterStore('DatabaseSchema.DatabaseSchemaStore');
}

export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
