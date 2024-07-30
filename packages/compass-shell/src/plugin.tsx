import React from 'react';
import thunk from 'redux-thunk';
import { HistoryStorage } from './modules/history-storage';
import { type Logger } from '@mongodb-js/compass-logging/provider';
import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { usePreference } from 'compass-preferences-model/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import TabShell from './components/compass-shell/tab-compass-shell';
import Shell from './components/compass-shell/compass-shell';
import { applyMiddleware, createStore } from 'redux';
import reducer, {
  createAndStoreRuntime,
  createRuntime,
  destroyCurrentRuntime,
  loadHistory,
} from './stores/store';
import type { ActivateHelpers } from 'hadron-app-registry';
import { Theme, ThemeProvider } from '@mongodb-js/compass-components';

const SHELL_THEME = { theme: Theme.Dark, enabled: true };

type ShellPluginProps = {
  initialEvaluate?: string | string[];
  initialInput?: string;
};

export function ShellPlugin(props: ShellPluginProps) {
  const multiConnectionsEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const ShellComponent = multiConnectionsEnabled ? TabShell : Shell;
  return (
    <ThemeProvider theme={SHELL_THEME}>
      <ShellComponent {...props} />
    </ThemeProvider>
  );
}

export type ShellPluginServices = {
  logger: Logger;
  track: TrackFunction;
  dataService: DataService;
  preferences: PreferencesAccess;
  connectionInfo: ConnectionInfoAccess;
};

export type ShellPluginExtraArgs = ShellPluginServices & {
  historyStorage: HistoryStorage;
};

export function onActivated(
  _initialProps: ShellPluginProps,
  services: ShellPluginServices,
  { addCleanup, cleanup }: ActivateHelpers
) {
  const { preferences, dataService, logger, track, connectionInfo } = services;

  const store = createStore(
    reducer,
    {
      runtimeId: preferences.getPreferences().enableShell
        ? createAndStoreRuntime(dataService, logger, track, connectionInfo).id
        : null,
      history: null,
    },
    applyMiddleware(
      thunk.withExtraArgument({
        ...services,
        historyStorage: new HistoryStorage(),
      })
    )
  );

  setTimeout(() => {
    void store.dispatch(loadHistory());
  });

  addCleanup(
    preferences.onPreferenceValueChanged('enableShell', (enabled) => {
      if (enabled) {
        store.dispatch(createRuntime());
      } else {
        store.dispatch(destroyCurrentRuntime());
      }
    })
  );

  function destroyRuntime() {
    store.dispatch(destroyCurrentRuntime());
  }

  addCleanup(destroyRuntime);

  // Trigger terminate when page unloads to kill the spawned child process
  // @ts-expect-error test ignore window undef with web worker ts config.
  window.addEventListener('beforeunload', destroyRuntime);

  addCleanup(() => {
    // @ts-expect-error test ignore window undef with web worker ts config.
    window.removeEventListener('beforeunload', destroyRuntime);
  });

  return { store, deactivate: cleanup };
}
