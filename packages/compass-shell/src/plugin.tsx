import React, { useState, useRef, useEffect } from 'react';
import CompassShellStore from './stores';
import { HistoryStorage } from './modules/history-storage';
import type CompassShellComponentType from './components/compass-shell';
import type AppRegistry from 'hadron-app-registry';
import {
  createLoggerLocator,
  type Logger,
} from '@mongodb-js/compass-logging/provider';
import type {
  ConnectionInfoAccess,
  DataService,
} from '@mongodb-js/compass-connections/provider';
import type { PreferencesAccess } from 'compass-preferences-model';
import { usePreference } from 'compass-preferences-model/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import { Theme, ThemeProvider } from '@mongodb-js/compass-components';

const SHELL_THEME = { theme: Theme.Dark, enabled: true };

export function ShellPlugin() {
  const multiConnectionsEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );
  const [ShellComponent, setShellComponent] = useState<
    typeof CompassShellComponentType | null
  >(null);
  const historyStorage = useRef<HistoryStorage | null>(null);

  if (!historyStorage.current) {
    historyStorage.current = new HistoryStorage();
  }

  useEffect(() => {
    let mounted = true;
    async function importShellComponent() {
      let component: typeof CompassShellComponentType | null = null;
      try {
        if (multiConnectionsEnabled) {
          component = (
            await import('./components/compass-shell/tab-compass-shell')
          ).default;
        } else {
          component = (await import('./components/compass-shell/compass-shell'))
            .default;
        }
      } finally {
        if (mounted) {
          setShellComponent(component);
        }
      }
    }

    void importShellComponent();

    return () => {
      mounted = false;
    };
  }, [multiConnectionsEnabled]);

  if (ShellComponent) {
    return (
      <ThemeProvider theme={SHELL_THEME}>
        <ShellComponent historyStorage={historyStorage.current} />
      </ThemeProvider>
    );
  }

  return null;
}

export function onActivated(
  _: unknown,
  {
    globalAppRegistry,
    logger,
    track,
    dataService,
    preferences,
    connectionInfoAccess,
  }: {
    globalAppRegistry: AppRegistry;
    logger: Logger;
    track: TrackFunction;
    dataService: DataService;
    preferences: PreferencesAccess;
    connectionInfoAccess: ConnectionInfoAccess;
  }
) {
  const store = new CompassShellStore();
  const deactivate = store.onActivated({
    globalAppRegistry,
    logger,
    track,
    dataService,
    preferences,
    connectionInfoAccess,
  });
  return {
    store: store.reduxStore,
    deactivate,
    logger: createLoggerLocator('COMPASS-SHELL'),
  };
}
