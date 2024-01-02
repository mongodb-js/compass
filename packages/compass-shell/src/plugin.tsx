import React, { useState, useRef, useEffect } from 'react';
import CompassShellStore from './stores';
import { HistoryStorage } from './modules/history-storage';
import type CompassShellComponentType from './components/compass-shell';
import type AppRegistry from 'hadron-app-registry';
import {
  createLoggerAndTelemetryLocator,
  type LoggerAndTelemetry,
} from '@mongodb-js/compass-logging/provider';
import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model';

export function ShellPlugin() {
  const [ShellComponent, setShellComponent] = useState<
    typeof CompassShellComponentType | null
  >(null);
  const historyStorage = useRef<HistoryStorage | null>(null);

  if (!historyStorage.current) {
    historyStorage.current = new HistoryStorage();
  }

  useEffect(() => {
    let mounted = true;

    void import(/* webpackPreload: true */ './components/compass-shell').then(
      ({ default: Component }) => {
        if (mounted) {
          setShellComponent(Component);
        }
      }
    );

    return () => {
      mounted = false;
    };
  }, []);

  if (ShellComponent) {
    return <ShellComponent historyStorage={historyStorage.current} />;
  }

  return null;
}

export function onActivated(
  _: unknown,
  {
    globalAppRegistry,
    logger,
    dataService,
    preferences,
  }: {
    globalAppRegistry: AppRegistry;
    logger: LoggerAndTelemetry;
    dataService: DataService;
    preferences: PreferencesAccess;
  }
) {
  const store = new CompassShellStore();
  const deactivate = store.onActivated({
    globalAppRegistry,
    logger,
    dataService,
    preferences,
  });
  return {
    store: store.reduxStore,
    deactivate,
    logger: createLoggerAndTelemetryLocator('COMPASS-SHELL'),
  };
}
