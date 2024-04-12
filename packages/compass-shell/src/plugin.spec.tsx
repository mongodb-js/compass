import sinon from 'sinon';
import React from 'react';
import type { ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { waitFor } from '@testing-library/react';
import { expect } from 'chai';

import { CompassShell } from './components/compass-shell';
import { CompassShellPlugin } from './index';
import { AppRegistryProvider, globalAppRegistry } from 'hadron-app-registry';
import {
  ConnectionsManager,
  ConnectionsManagerProvider,
  ConnectionInfoProvider,
} from '@mongodb-js/compass-connections/provider';
import { createNoopLoggerAndTelemetry } from '@mongodb-js/compass-logging/provider';
import {
  ConnectionStorageProvider,
  InMemoryConnectionStorage,
} from '@mongodb-js/connection-storage/provider';

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
    logger: createNoopLoggerAndTelemetry().log.unbound,
  });
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

    const component = await waitFor(() => {
      wrapper?.update();
      const component = wrapper?.find(CompassShell);
      expect(component).to.have.lengthOf(1);
      return component;
    });

    expect(component?.exists()).to.equal(true);
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

    const shellComponentWrapper = await waitFor(() => {
      wrapper?.update();
      const component = wrapper?.find(CompassShell);
      expect(component).to.have.lengthOf(1);
      return component;
    });

    const { emitShellPluginOpened } = shellComponentWrapper?.props() ?? {};
    emitShellPluginOpened?.();

    expect(eventOccured).to.equal(true);
  });
});
