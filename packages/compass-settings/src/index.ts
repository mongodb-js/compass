import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { atlasAuthServiceLocator } from '@mongodb-js/atlas-service/provider';
import { atlasAiServiceLocator } from '@mongodb-js/compass-generative-ai/provider';
import { preferencesLocator } from 'compass-preferences-model/provider';
import SettingsPlugin from './components/index';
import { onActivated } from './stores';
import { I18nProvider, initLanguage } from './i18n';

export type { SettingsTabId } from './stores/settings';

function SettingsPluginWithI18n(): React.ReactElement {
  return React.createElement(
    I18nProvider,
    null,
    React.createElement(SettingsPlugin)
  );
}

export const CompassSettingsPlugin = registerCompassPlugin(
  {
    name: 'CompassSettings',
    component: SettingsPluginWithI18n,
    activate: (initialProps, services, helpers) => {
      initLanguage(services.preferences.getPreferences().language);
      return onActivated(initialProps, services, helpers);
    },
  },
  {
    logger: createLoggerLocator('COMPASS-SETTINGS'),
    track: telemetryLocator,
    preferences: preferencesLocator,
    atlasAiService: atlasAiServiceLocator,
    atlasAuthService: atlasAuthServiceLocator,
  }
);
