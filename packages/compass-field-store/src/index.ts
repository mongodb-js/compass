import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/store';

function activate() {
  // noop
}

function deactivate() {
  // noop
}

const FieldStorePlugin = registerHadronPlugin({
  name: 'FieldStore',
  component() {
    // FieldStore plugin doesn't render anything, just subscribes to the events
    // and emits its own
    return null;
  },
  activate: activatePlugin,
});

export default FieldStorePlugin;
export { activate, deactivate };
export { default as metadata } from '../package.json';
