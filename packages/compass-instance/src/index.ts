import type AppRegistry from 'hadron-app-registry';

import InstancePlugin from './plugin';
import InstanceStore from './stores';

function activate(appRegistry: AppRegistry) {
  appRegistry.registerComponent('Instance.Workspace', InstancePlugin);
  appRegistry.registerStore('Instance.Store', InstanceStore);
}

function deactivate(appRegistry: AppRegistry) {
  appRegistry.deregisterComponent('Instance.Workspace');
  appRegistry.deregisterStore('Instance.Store');
}

export default InstancePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
