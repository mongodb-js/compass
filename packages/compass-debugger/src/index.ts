import type AppRegistry from 'hadron-app-registry';

import Component from './components/debugger';

const role = {
  component: Component,
  name: 'Debugger',
  order: 99,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Instance.Tab', role);
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Instance.Tab', role);
}

export { activate, deactivate };

export { default as metadata } from '../package.json';
