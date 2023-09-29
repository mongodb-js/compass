import { registerHadronPlugin } from 'hadron-app-registry';
import Home from './plugin';

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
  activate({ localAppRegistry }) {
    // TODO: This is where we should be subscribing to appRegistry instead of
    // passing it directly to the component. Keeping it as-is as cleaning up
    // compass-home is a bigger refactor that is not in scope
    return {
      // Not the purpose of this inteface, just for compatibility we make it
      // work in a way that will not break compass-home dependency on app
      // registry that should be removed
      store: {
        state: { appRegistry: localAppRegistry },
      },
    };
  },
});

export { activate, deactivate };
export { default as metadata } from '../package.json';
