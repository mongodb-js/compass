import { registerHadronPlugin } from 'hadron-app-registry';
import CompassFindInPage from './components/compass-find-in-page';
import { activatePlugin } from './stores/store';

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export const CompassFindInPagePlugin = registerHadronPlugin({
  name: 'CompassFindInPage',
  component: CompassFindInPage,
  activate: activatePlugin,
});

export { activate, deactivate };
export { default as metadata } from '../package.json';
