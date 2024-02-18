import { registerHadronPlugin } from 'hadron-app-registry';
import { createLoggerAndTelemetryLocator } from '@mongodb-js/compass-logging/provider';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { atlasAiServiceLocator } from '@mongodb-js/compass-generative-ai/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
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
    atlasAiService: atlasAiServiceLocator,
    atlasAuthService: atlasAuthServiceLocator,
  }
);
