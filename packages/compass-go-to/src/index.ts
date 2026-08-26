import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { CompassGoTo } from './components/compass-go-to';

export const CompassGoToPlugin = registerCompassPlugin({
  name: 'CompassGoTo',
  component: CompassGoTo,
  activate() {
    return { store: {}, deactivate() {} };
  },
});
