import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';

const Plugin = registerCompassPlugin({
  name: 'Plugin',
  component: () => null,
  activate(initialProps, services, activateHelpers) {
    return {};
  },
});

export default Plugin;
