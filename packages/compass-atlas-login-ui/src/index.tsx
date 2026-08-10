import React from 'react';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import { registerCompassPlugin } from '@mongodb-js/compass-app-registry';
import {
  atlasAuthServiceLocator,
  type AtlasAuthService,
} from '@mongodb-js/atlas-service/provider';
import { AtlasLoginStoreContext } from './stores/store-context';
import {
  configureStore,
  refreshUserInfo,
  clearUserInfo,
} from './stores/store-redux';

const AtlasLoginComponent: React.FunctionComponent = ({ children }) => {
  return <>{children}</>;
};

export const CompassAtlasLoginPlugin = registerCompassPlugin(
  {
    name: 'CompassAtlasLogin',
    component: AtlasLoginComponent,
    activate(
      _initialProps: Record<string, never>,
      { atlasAuthService }: { atlasAuthService: AtlasAuthService },
      { on, cleanup }: ActivateHelpers
    ) {
      const store = configureStore({ atlasAuthService });

      void store.dispatch(refreshUserInfo());
      on(atlasAuthService, 'signed-in', () => {
        void store.dispatch(refreshUserInfo());
      });
      on(atlasAuthService, 'signed-out', () => {
        store.dispatch(clearUserInfo());
      });

      return { store, deactivate: cleanup, context: AtlasLoginStoreContext };
    },
  },
  {
    atlasAuthService: atlasAuthServiceLocator,
  }
);

export { AtlasConnectionStatus } from './components/atlas-connection-status';
export type { AtlasConnectionStatusProps } from './components/atlas-connection-status';
export {
  useAtlasSignedInUser,
  useAtlasLoginActions,
} from './stores/store-context';
