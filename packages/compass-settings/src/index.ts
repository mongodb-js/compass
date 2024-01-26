import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import SettingsPlugin from './components/index';
import { onActivated } from './stores';

export const CompassSettingsPlugin = registerHadronPlugin(
  {
    name: 'CompassSettings',
    component: SettingsPlugin,
    activate: onActivated,
  },
  {
    logger: createLoggerAndTelemetryLocator('COMPASS-SETTINGS'),
    preferences: preferencesLocator,
    atlasService: atlasServiceLocator,
  }
);
