import { createStore } from 'redux';
import reducer from '../modules';
import { setupRuntime } from '../modules/runtime';
import { globalAppRegistryActivated } from '@mongodb-js/mongodb-redux-common/app-registry';
import { setupLoggerAndTelemetry } from '@mongosh/logging';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import preferences from 'compass-preferences-model';

const { log, debug, track } = createLoggerAndTelemetry('COMPASS-SHELL');

export default class CompassShellStore {
  constructor() {
    this.reduxStore = createStore(reducer);
  }

  globalAppRegistry = null;

  onActivated(appRegistry) {
    debug('activated');

    this.globalAppRegistry = appRegistry;

    appRegistry.on('data-service-connected', this.onDataServiceConnected);

    appRegistry.on('data-service-disconnected', this.onDataServiceDisconnected);

    setupLoggerAndTelemetry(
      appRegistry,
      log.unbound,
      {
        identify: () => {},
        // Prefix Segment events with `Shell ` to avoid event name collisions.
        // We always enable telemetry here, since the track call will
        // already check whether Compass telemetry is enabled or not.
        track: ({ event, properties }) => track(`Shell ${event}`, properties)
      },
      {
        platform: process.platform,
        arch: process.arch,
      },
      require('../../package.json').version
    );
    // We also don't need to pass a proper user id, since that is
    // handled by the Compass tracking code.
    appRegistry.emit('mongosh:new-user', '<compass user>');

    // Set the global app registry in the store.
    this.reduxStore.dispatch(globalAppRegistryActivated(appRegistry));
  }

  onDataServiceConnected = (error, dataService) => {
    this.reduxStore.dispatch(
      setupRuntime(error, dataService, this.globalAppRegistry)
    );
  };

  onDataServiceDisconnected = () => {
    const {
      runtime: { runtime },
    } = this.reduxStore.getState();

    if (runtime) {
      runtime.terminate();
    }

    this.reduxStore.dispatch(setupRuntime(null, null, null));
  };
}
