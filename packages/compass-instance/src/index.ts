import { registerHadronPlugin } from 'hadron-app-registry';
import InstanceWorkspace from './plugin';
import { activatePlugin } from './stores';
import { mongoDBInstanceLocator } from '@mongodb-js/compass-app-stores/provider';

function activate() {
  // noop
}

function deactivate() {
  // noop
}

const InstanceWorkspacePlugin = registerHadronPlugin(
  {
    name: 'InstanceWorkspace',
    component: InstanceWorkspace,
    activate: activatePlugin,
  },
  {
    instance: mongoDBInstanceLocator,
  }
);

export default InstanceWorkspacePlugin;
export {
  InstanceTabsProvider,
  InstanceTab,
} from './components/instance-tabs-provider';
export { activate, deactivate };
export { default as metadata } from '../package.json';
