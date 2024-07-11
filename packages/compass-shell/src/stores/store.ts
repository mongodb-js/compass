import type { Store } from 'redux';
import { createStore } from 'redux';
import type { RootAction, RootState } from '../modules';
import reducer from '../modules';
import { changeEnableShell, setupRuntime } from '../modules/runtime';
import { setupLoggerAndTelemetry } from '@mongosh/logging';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type AppRegistry from 'hadron-app-registry';
import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';

export default class CompassShellStore {
  reduxStore: Store<RootState, RootAction>;

  constructor() {
    this.reduxStore = createStore(reducer);
  }

  globalAppRegistry: AppRegistry | null = null;
  preferences: PreferencesAccess | null = null;

  onActivated({
    globalAppRegistry,
    logger: { log, debug },
    track,
    dataService,
    connectionInfoAccess,
    preferences,
  }: {
    globalAppRegistry: AppRegistry;
    logger: Logger;
    track: TrackFunction;
    dataService: DataService;
    connectionInfoAccess: ConnectionInfoAccess;
    preferences: PreferencesAccess;
  }): () => void {
    debug('activated');

    this.globalAppRegistry = globalAppRegistry;
    this.preferences = preferences;

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
        track: ({ event, properties }) =>
          track(
            `Shell ${event}`,
            properties,
            connectionInfoAccess.getCurrentConnectionInfo()
          ),
        flush: () => {
          return Promise.resolve(); // not needed
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
