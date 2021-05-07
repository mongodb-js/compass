import InstancePlugin from './plugin';

const ROLE = {
  name: 'Instance',
  component: InstancePlugin
};

function activate(appRegistry) {
  appRegistry.registerRole('Instance.Workspace', ROLE);
}

function deactivate(appRegistry) {
  appRegistry.deregisterRole('Instance.Workspace', ROLE);
  appRegistry.deregisterAction('Instance.Actions');
  appRegistry.deregisterStore('Instance.Store');
}

export default InstancePlugin;
export { activate, deactivate };
