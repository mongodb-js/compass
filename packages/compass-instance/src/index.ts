import { registerHadronPlugin } from 'hadron-app-registry';
import InstancePlugin from './plugin';
import { onActivated } from './stores';

function activate() {
  registerHadronPlugin({
    name: 'InstanceWorkspace',
    component: InstancePlugin,
    onActivated(options) {
      return { store: onActivated(options) };
    },
    activateOnRegister: true,
  });
}

export default InstancePlugin;
export { activate };
export { default as metadata } from '../package.json';
