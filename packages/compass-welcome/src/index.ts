import type AppRegistry from 'hadron-app-registry';

function activate(appRegistry: AppRegistry): void {
  // Register plugin stores, roles, and components
}

function deactivate(appRegistry: AppRegistry): void {
  // Unregister plugin stores, roles, and components
}

export { activate, deactivate };
export { default as metadata } from '../package.json';
