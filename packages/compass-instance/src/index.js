import InstancePlugin from './plugin';
import InstanceStore from './stores';

function activate(appRegistry) {
  appRegistry.registerComponent('Instance.Workspace', InstancePlugin);
  appRegistry.registerStore('Instance.Store', InstanceStore);
}

function deactivate(appRegistry) {
  appRegistry.deregisterComponent('Instance.Workspace');
  appRegistry.deregisterStore('Instance.Store');
}

export default InstancePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
