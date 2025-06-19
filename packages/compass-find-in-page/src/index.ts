import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import CompassFindInPage from './components/compass-find-in-page';
import { activatePlugin } from './stores/store';

export const CompassFindInPagePlugin = registerCompassPlugin({
  name: 'CompassFindInPage',
  component: CompassFindInPage,
  activate: activatePlugin,
});
