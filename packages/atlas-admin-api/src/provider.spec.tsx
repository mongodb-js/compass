import React from 'react';
import { expect } from 'chai';
import Sinon from 'sinon';
import { EventEmitter } from 'events';
import { render } from '@mongodb-js/testing-library-compass';
import {
  AppRegistryProvider,
  registerCompassPlugin,
} from '@mongodb-js/compass-app-registry';
import {
  AtlasAuthServiceProvider,
  AtlasServiceProvider,
} from '@mongodb-js/atlas-service/provider';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import {
  AtlasAdminApiServiceProvider,
  atlasAdminApiServiceLocator,
} from './provider';
import type { AtlasAdminApiService } from './atlas-admin-api-service';

describe('AtlasAdminApiServiceProvider', function () {
  let authService: EventEmitter;
  let resolved: AtlasAdminApiService[];

  // The locator is only callable during plugin activation, so resolve it
  // through a throwaway plugin rather than from a render method. Activation is
  // deduped per plugin name within a registry, hence the distinct names.
  function createConsumer(name: string) {
    return registerCompassPlugin(
      {
        name,
        component: function Component() {
          return null;
        },
        activate(
          _initialProps: unknown,
          { atlasAdminApi }: { atlasAdminApi: AtlasAdminApiService }
        ) {
          resolved.push(atlasAdminApi);
          return { store: { state: {} }, deactivate: () => undefined };
        },
      },
      { atlasAdminApi: atlasAdminApiServiceLocator }
    );
  }

  const Consumer = createConsumer('AtlasAdminApiConsumer');
  const OtherConsumer = createConsumer('AtlasAdminApiOtherConsumer');

  function renderWithProviders(children: React.ReactNode) {
    return render(
      <AppRegistryProvider>
        <AtlasAuthServiceProvider
          value={authService as unknown as AtlasAuthService}
        >
          <AtlasServiceProvider>
            <AtlasAdminApiServiceProvider>
              {children}
            </AtlasAdminApiServiceProvider>
          </AtlasServiceProvider>
        </AtlasAuthServiceProvider>
      </AppRegistryProvider>
    );
  }

  beforeEach(function () {
    resolved = [];
    authService = new EventEmitter();
  });

  it('should resolve the service through the locator', function () {
    renderWithProviders(<Consumer />);

    expect(resolved).to.have.lengthOf(1);
    expect(resolved[0]).to.have.property('getProjectIdAndClusterName');
  });

  it('should hand every consumer the same instance', function () {
    renderWithProviders(
      <>
        <Consumer />
        <OtherConsumer />
      </>
    );

    expect(resolved).to.have.lengthOf(2);
    expect(resolved[0]).to.equal(resolved[1]);
  });

  it('should clear the cache when the user signs out or in', function () {
    renderWithProviders(<Consumer />);

    const clearCache = Sinon.spy(resolved[0], 'clearCache');

    authService.emit('signed-out');
    expect(clearCache.callCount).to.equal(1);
  });

  it('should stop clearing the cache once unmounted', function () {
    const { unmount } = renderWithProviders(<Consumer />);

    const clearCache = Sinon.spy(resolved[0], 'clearCache');
    unmount();

    authService.emit('signed-out');
    expect(clearCache.called).to.be.false;
  });
});
