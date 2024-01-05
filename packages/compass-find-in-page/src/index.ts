import { registerHadronPlugin } from 'hadron-app-registry';
import CompassFindInPage from './components/compass-find-in-page';
import { activatePlugin } from './stores/store';

export const CompassFindInPagePlugin = registerHadronPlugin({
  name: 'CompassFindInPage',
  component: CompassFindInPage,
  activate: activatePlugin,
});
