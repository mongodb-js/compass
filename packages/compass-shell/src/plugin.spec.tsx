import sinon from 'sinon';
import React from 'react';
import type { ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { CompassShell } from './components/compass-shell';
import { CompassShellPlugin } from './index';
import { AppRegistryProvider } from 'hadron-app-registry';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  ConnectionInfoProvider,
} from '@mongodb-js/compass-connections/provider';
import { createNoopLogger } from '@mongodb-js/compass-logging/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

// Wait until a component is present that is rendered in a limited number
// of microtask queue iterations. In particular, this does *not* wait for the
// event loop itself to progress.
async function waitForAsyncComponent(wrapper, Component, attempts = 10) {
  let current = 0;
  let result;
  while (current++ < attempts) {
    wrapper.update();
    result = wrapper.find(Component);
    // Return immediately if we found something
    if (result.length > 0 && result.exists()) {
      return result;
    }
    await new Promise((r) => setTimeout(r)); // wait a microtask queue iteration
  }
  return result;
}

describe('CompassShellPlugin', function () {
  const dummyConnectionInfo = {
    id: '1',
    connectionOptions: {
      connectionString: 'mongodb://localhost:27017',
    },
  };

  const fakeDataService = {
    getMongoClientConnectionOptions() {},
  } as any;

  const connectionsManager = new ConnectionsManager({
    logger: createNoopLogger().log.unbound,
  });

  sinon.replace(connectionsManager, 'getDataServiceForConnection', () => {
    return fakeDataService;
  });

  let wrapper: ReactWrapper | null;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });

  // TODO(COMPASS-7906): remove
  it.skip('returns a renderable plugin', async function () {
    connectionsManager['connectionStatuses'].set('1', 'connected');
    wrapper = mount(
      <AppRegistryProvider>
        {/* global */}
        <AppRegistryProvider>
          {/* local */}
          <ConnectionStorageProvider
            value={new InMemoryConnectionStorage([dummyConnectionInfo])}
          >
            <ConnectionsManagerProvider value={connectionsManager}>
              <ConnectionInfoProvider connectionInfoId={dummyConnectionInfo.id}>
                <CompassShellPlugin />
              </ConnectionInfoProvider>
            </ConnectionsManagerProvider>
          </ConnectionStorageProvider>
        </AppRegistryProvider>
      </AppRegistryProvider>
    );

    const component = await waitForAsyncComponent(wrapper, CompassShell);

    expect(component?.exists()).to.equal(true);
  });
});
