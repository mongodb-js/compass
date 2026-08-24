import React from 'react';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import { activatePlugin } from './store/atlas-signin-store';
import { atlasAuthServiceLocator } from './provider';
import { telemetryLocator } from '@mongodb-js/compass-telemetry/provider';

const AtlasAuthComponent: React.FunctionComponent = ({ children }) => {
  return <>{children}</>;
};

export const AtlasAuthPlugin = registerCompassPlugin(
  {
    name: 'AtlasAuth',
    component: AtlasAuthComponent,
    activate: activatePlugin,
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
    track: telemetryLocator,
  }
);
export default AtlasAuthPlugin;
export { AtlasServiceError } from './util';
export type { AtlasUserInfo } from './util';
export { CompassAtlasAuthService } from './compass-atlas-auth-service';
