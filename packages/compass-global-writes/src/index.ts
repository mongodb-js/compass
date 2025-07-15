import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';

import GlobalWrites from './components';
import { GlobalWritesTabTitle } from './plugin-title';
import { activateGlobalWritesPlugin } from './store';
import { createLoggerLocator } from '@mongodb-js/compass-logging/provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';
import { connectionInfoRefLocator } from '@mongodb-js/compass-connections/provider';
import { atlasServiceLocator } from '@mongodb-js/atlas-service/provider';
export { AtlasGlobalWritesService } from './services/atlas-global-writes-service';

const CompassGlobalWritesPluginProvider = registerCompassPlugin(
  {
    name: 'CompassGlobalWrites',
    component: function GlobalWritesProvider({ children }) {
      return React.createElement(React.Fragment, null, children);
    },
    activate: activateGlobalWritesPlugin,
  },
  {
    logger: createLoggerLocator('COMPASS-GLOBAL-WRITES-UI'),
    track: telemetryLocator,
    connectionInfoRef: connectionInfoRefLocator,
    atlasService: atlasServiceLocator,
  }
);

export const CompassGlobalWritesPlugin = {
  name: 'GlobalWrites' as const,
  provider: CompassGlobalWritesPluginProvider,
  content: GlobalWrites as React.FunctionComponent,
  header: GlobalWritesTabTitle as React.FunctionComponent,
};
