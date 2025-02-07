import React from 'react';
import thunk from 'redux-thunk';
import { HistoryStorage } from './modules/history-storage';
import { type Logger } from '@mongodb-js/compass-logging/provider';
import type {
  ConnectionInfoRef,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import TabShell from './components/compass-shell/tab-compass-shell';
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
  runtimeId?: string;
  initialEvaluate?: string | string[];
  initialInput?: string;
};

export function ShellPlugin(props: ShellPluginProps) {
  return (
    <ThemeProvider theme={SHELL_THEME}>
      <TabShell {...props} />
    </ThemeProvider>
  );
}

export type ShellPluginServices = {
  logger: Logger;
  track: TrackFunction;
  dataService: DataService;
  preferences: PreferencesAccess;
  connectionInfo: ConnectionInfoRef;
};

export type ShellPluginExtraArgs = ShellPluginServices & {
  historyStorage: HistoryStorage;
};

export function onActivated(
  initialProps: ShellPluginProps,
  services: ShellPluginServices,
  { addCleanup, cleanup }: ActivateHelpers
) {
  const { preferences, dataService, logger, track, connectionInfo } = services;

  const store = createStore(
    reducer,
    {
      runtimeId: preferences.getPreferences().enableShell
        ? initialProps.runtimeId ??
          createAndStoreRuntime(dataService, logger, track, connectionInfo).id
        : null,
      history: null,
      mongoshVersion: '',
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
  window.addEventListener('beforeunload', destroyRuntime);

  addCleanup(() => {
    window.removeEventListener('beforeunload', destroyRuntime);
  });

  return { store, deactivate: cleanup };
}
