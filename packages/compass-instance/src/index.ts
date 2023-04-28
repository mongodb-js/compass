import { registerHadronPlugin } from 'hadron-app-registry';
import InstancePlugin from './plugin';
import InstanceStore from './stores';

function activate() {
  registerHadronPlugin({
    name: 'InstanceWorkspace',
    component: InstancePlugin,
    onActivated(options) {
      InstanceStore.onActivated(options);
      return { store: InstanceStore };
    },
  });
}

export default InstancePlugin;
export { activate };
export { default as metadata } from '../package.json';
