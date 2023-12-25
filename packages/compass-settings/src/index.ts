import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import SettingsPlugin from './components/index';
import { onActivated } from './stores';

function activate(): void {
  // noop
}

function deactivate(): void {
  // noop
}

export const CompassSettingsPlugin = registerHadronPlugin(
  {
    name: 'CompassSettings',
    component: SettingsPlugin,
    activate: onActivated,
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-SETTINGS'),
    preferences: preferencesLocator,
  }
);

export { activate, deactivate };
export { default as metadata } from '../package.json';
