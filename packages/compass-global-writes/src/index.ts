import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';

import GlobalWrites from './components';
import { GlobalWritesTabTitle } from './plugin-title';
import {
  activateGlobalWritesPlugin,
  type GlobalWritesPluginServices,
} from './store';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
import {
  preferencesLocator,
  type PreferencesAccess,
} from 'compass-preferences-model/provider';
import { I18nProvider, initLanguage } from './i18n';

const CompassGlobalWritesPluginProvider = registerCompassPlugin(
  {
    name: 'CompassGlobalWrites',
    component: function GlobalWritesProvider({ children }) {
      return React.createElement(I18nProvider, null, children);
    },
    activate: (
      props,
      {
        preferences,
        ...services
      }: GlobalWritesPluginServices & {
        preferences: PreferencesAccess;
      },
      helpers
    ) => {
      initLanguage(preferences.getPreferences().language);
      return activateGlobalWritesPlugin(props, services, helpers);
    },
  },
  {
    logger: createLoggerLocator('COMPASS-GLOBAL-WRITES-UI'),
    track: telemetryLocator,
    connectionInfoRef: connectionInfoRefLocator,
    atlasService: atlasServiceLocator,
    preferences: preferencesLocator,
  }
);

export const CompassGlobalWritesPlugin = {
  name: 'GlobalWrites' as const,
  provider: CompassGlobalWritesPluginProvider,
  content: GlobalWrites as React.FunctionComponent,
  header: GlobalWritesTabTitle as React.FunctionComponent,
};
