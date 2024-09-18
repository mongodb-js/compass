import { expect } from 'chai';
import type { AtlasAuthPluginServices } from './atlas-signin-store';
import { activatePlugin } from './atlas-signin-store';
import type { ActivateHelpers } from 'hadron-app-registry';
import { waitFor } from '@mongodb-js/testing-library-compass';

const activateHelpers = {
  on: () => {},
  addCleanup: () => {},
  cleanup: () => {},
} as unknown as ActivateHelpers;

describe('Atlas Signin Store', () => {
  context('when plugin is activated', function () {
    it('should restore the sign-in state - when signed in', async function () {
      const services = {
        atlasAuthService: {
          isAuthenticated: () => Promise.resolve(true),
          getUserInfo: () => Promise.resolve({ sub: '1234' }),
        },
      } as unknown as AtlasAuthPluginServices;
      const { store } = activatePlugin({}, services, activateHelpers);
      expect(store.getState()).to.have.property('state', 'restoring');
      await waitFor(() => {
        expect(store.getState()).to.have.property('state', 'success');
      });
      expect(store.getState()).to.have.nested.property('userInfo.sub', '1234');
    });
    it('should restore the sign-in state - when signed out', async function () {
      const services = {
        atlasAuthService: {
          isAuthenticated: () => Promise.resolve(false),
        },
      } as unknown as AtlasAuthPluginServices;
      const { store } = activatePlugin({}, services, activateHelpers);
      expect(store.getState()).to.have.property('state', 'restoring');
      await waitFor(() => {
        expect(store.getState()).to.have.property('state', 'unauthenticated');
      });
      expect(store.getState()).to.have.property('userInfo', null);
    });
  });
});
