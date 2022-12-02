import React from 'react';
import { mount } from 'enzyme';
import { EventEmitter } from 'events';
import { expect } from 'chai';

import { CompassShell } from './components/compass-shell';
import createPlugin from './plugin';
import CompassShellStore from './stores';

function nextTick() {
  return new Promise(resolve => process.nextTick(resolve));
}

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
    await nextTick();
  }
  return result;
}

describe('CompassShellPlugin', function() {
  it('returns a renderable plugin', async function() {
    const { Plugin } = createPlugin();

    const wrapper = mount(<Plugin />);

    const component = await waitForAsyncComponent(wrapper, CompassShell);

    expect(component.exists()).to.equal(true);
  });

  it('returns a CompassShellStore store', function() {
    const { store } = createPlugin();
    const appRegistry = new EventEmitter();
    store.onActivated(appRegistry);
    expect(store).to.be.instanceOf(CompassShellStore);
  });

  it('emits an event on the app registry when it is expanded', async function() {
    const { store, Plugin } = createPlugin();

    const appRegistry = new EventEmitter();
    let eventOccured = false;
    appRegistry.on('compass:compass-shell:opened', () => {
      eventOccured = true;
    });

    store.onActivated(appRegistry);

    const wrapper = mount(<Plugin />);
    const shellComponentWrapper = await waitForAsyncComponent(wrapper, CompassShell);

    const { emitShellPluginOpened } = shellComponentWrapper.props();
    emitShellPluginOpened();

    expect(eventOccured).to.equal(true);
  });
});

