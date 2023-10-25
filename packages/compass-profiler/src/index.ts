import type AppRegistry from 'hadron-app-registry';
import Component from './components/profiler-page';
import configureStore, { getStore } from './stores';

const role = {
  component: Component,
  name: 'Profiler',
  order: 4,
  configureStore,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Instance.Tab', role);
  appRegistry.registerStore(
    'Profiler.ProfilerStore',
    getStore(appRegistry) as any
  );
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Instance.Tab', role);
  appRegistry.deregisterStore('Profiler.ProfilerStore');
}

export { activate, deactivate, configureStore };
export { default as metadata } from '../package.json';
