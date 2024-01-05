import { registerHadronPlugin } from 'hadron-app-registry';
import { activatePlugin } from './stores/store';

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
