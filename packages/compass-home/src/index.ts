import { registerHadronPlugin } from 'hadron-app-registry';
import Home from './components/home';

/**
 * Activate all the components in the Home package.
 **/
function activate(): void {
  // noop
}

/**
 * Deactivate all the components in the Home package.
 **/
function deactivate(): void {
  // noop
}

export const CompassHomePlugin = registerHadronPlugin({
  name: 'CompassHome',
  component: Home,
  activate(/* ..., { globalAppRegistry, localAppRegistry } */) {
    // TODO: This is where we should be subscribing to appRegistry events
    // instead of passing it directly to the Home component. Keeping it as-is
    // as cleaning up compass-home is a bigger refactor that is not in scope
    return {
      store: {
        state: {},
      },
      deactivate() {
        /* noop */
      },
    };
  },
});

export { activate, deactivate };
export { default as metadata } from '../package.json';
