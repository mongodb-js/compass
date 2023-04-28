import { registerHadronPlugin } from 'hadron-app-registry';
import HomePlugin from './plugin';

/**
 * Activate all the components in the Home package.
 **/
function activate(): void {
  registerHadronPlugin({
    name: 'Home',
    component: HomePlugin,
    onActivated({ globalAppRegistry }) {
      return {
        store: {
          // Really not the purpose of this interface, but home plugin relies on
          // direct access to appRegistry too much unfortunately
          state: { appRegistry: globalAppRegistry },
        },
      };
    },
    onDeactivated() {
      // noop
    },
  });
}

export default HomePlugin;
export { activate };
export { default as metadata } from '../package.json';
