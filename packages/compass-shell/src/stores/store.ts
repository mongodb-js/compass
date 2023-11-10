import type { Store } from 'redux';
import { createStore } from 'redux';
import type { RootAction, RootState } from '../modules';
import reducer from '../modules';
import { changeEnableShell, setupRuntime } from '../modules/runtime';
import { setupLoggerAndTelemetry } from '@mongosh/logging';
import type { LoggerAndTelemetry } from '@mongodb-js/compass-logging';
import preferences from 'compass-preferences-model';
import type AppRegistry from 'hadron-app-registry';
import type { DataService } from 'mongodb-data-service';

export default class CompassShellStore {
  reduxStore: Store<RootState, RootAction>;

  constructor() {
    this.reduxStore = createStore(reducer);
  }

  globalAppRegistry: AppRegistry | null = null;

  onActivated({
    globalAppRegistry,
    logger: { log, track, debug },
    dataService,
  }: {
    globalAppRegistry: AppRegistry;
    logger: LoggerAndTelemetry;
    dataService: DataService;
  }): () => void {
    debug('activated');

    this.globalAppRegistry = globalAppRegistry;

    const unsubscribePreference = preferences.onPreferenceValueChanged(
      'enableShell',
      this.onEnableShellChanged
    );
    this.onEnableShellChanged(preferences.getPreferences().enableShell);

    setupLoggerAndTelemetry(
      globalAppRegistry,
      log.unbound,
      {
        identify: () => {
          /* not needed */
        },
        // Prefix Segment events with `Shell ` to avoid event name collisions.
        // We always enable telemetry here, since the track call will
        // already check whether Compass telemetry is enabled or not.
        track: ({ event, properties }) => track(`Shell ${event}`, properties),
        flush: () => {
          /* not needed */
        },
      },
      {
        platform: process.platform,
        arch: process.arch,
      },
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-var-requires
      require('../../package.json').version
    );
    // We also don't need to pass a proper user id, since that is
    // handled by the Compass tracking code.
    globalAppRegistry.emit('mongosh:new-user', '<compass user>');

    // Set the global app registry in the store.
    this.reduxStore.dispatch(
      setupRuntime(null, dataService, this.globalAppRegistry)
    );

    return () => {
      unsubscribePreference();
      this.reduxStore.dispatch(setupRuntime(null, null, null));
    };
  }

  onEnableShellChanged = (value: boolean) => {
    this.reduxStore.dispatch(changeEnableShell(value));
  };
}
