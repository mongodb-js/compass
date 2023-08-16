import type AppRegistry from 'hadron-app-registry';
import SettingsPlugin from './components/index';
import SettingsStore from './stores';

const ROLE = {
  name: 'SettingsModal',
  component: SettingsPlugin,
};

function activate(appRegistry: AppRegistry): void {
  appRegistry.registerRole('Global.Modal', ROLE);
  appRegistry.registerStore('Settings.Store', SettingsStore);
}

function deactivate(appRegistry: AppRegistry): void {
  appRegistry.deregisterRole('Global.Modal', ROLE);
  appRegistry.deregisterStore('Settings.Store');
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
