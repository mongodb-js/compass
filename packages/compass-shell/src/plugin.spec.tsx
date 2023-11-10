import React from 'react';
import type { ReactWrapper } from 'enzyme';
import { mount } from 'enzyme';
import { expect } from 'chai';

import { CompassShell } from './components/compass-shell';
import { CompassShellPlugin } from './index';
import { AppRegistryProvider, globalAppRegistry } from 'hadron-app-registry';
import { DataServiceProvider } from 'mongodb-data-service/provider';

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
  const fakeDataService = {
    getMongoClientConnectionOptions() {},
  } as any;
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
          <DataServiceProvider value={fakeDataService}>
            <CompassShellPlugin />
          </DataServiceProvider>
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
          <DataServiceProvider value={fakeDataService}>
            <CompassShellPlugin />
          </DataServiceProvider>
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
