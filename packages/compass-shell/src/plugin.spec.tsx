import sinon from 'sinon';
import React from 'react';
import type { ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { CompassShell } from './components/compass-shell';
import { CompassShellPlugin } from './index';
import { AppRegistryProvider, globalAppRegistry } from 'hadron-app-registry';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
} from '@mongodb-js/compass-connections/provider';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';

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
    if (result.length > 0) {
      return result;
    }
    await Promise.resolve(); // wait a microtask queue iteration
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

  const connectionsManager = new ConnectionsManager(
    createNoopLoggerAndTelemetry().log.unbound,
    () => {}
  );
  sinon.replace(connectionsManager, 'getDataServiceForConnection', () => {
    return fakeDataService;
  });

  let wrapper: ReactWrapper | null;

  afterEach(() => {
    wrapper?.unmount();
    wrapper = null;
  });
  it('returns a renderable plugin', async function () {
    wrapper = mount(
      <AppRegistryProvider>
        {/* global */}
        <AppRegistryProvider>
          {/* local */}
          <ConnectionsManagerProvider value={connectionsManager}>
            <ConnectionInfoProvider value={dummyConnectionInfo}>
              <CompassShellPlugin />
            </ConnectionInfoProvider>
          </ConnectionsManagerProvider>
        </AppRegistryProvider>
      </AppRegistryProvider>
    );

    const component = await waitForAsyncComponent(wrapper, CompassShell);

    expect(component.exists()).to.equal(true);
  });

  it('emits an event on the app registry when it is expanded', async function () {
    let eventOccured = false;
    globalAppRegistry.on('compass:compass-shell:opened', () => {
      eventOccured = true;
    });

    wrapper = mount(
      <AppRegistryProvider>
        {/* global */}
        <AppRegistryProvider>
          {/* local */}
          <ConnectionsManagerProvider value={connectionsManager}>
            <ConnectionInfoProvider value={dummyConnectionInfo}>
              <CompassShellPlugin />
            </ConnectionInfoProvider>
          </ConnectionsManagerProvider>
        </AppRegistryProvider>
      </AppRegistryProvider>
    );

    const shellComponentWrapper = await waitForAsyncComponent(
      wrapper,
      CompassShell
    );

    const { emitShellPluginOpened } = shellComponentWrapper.props();
    emitShellPluginOpened();

    expect(eventOccured).to.equal(true);
  });
});
