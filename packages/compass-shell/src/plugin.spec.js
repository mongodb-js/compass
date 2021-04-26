import React from 'react';
import { mount } from 'enzyme';
import { EventEmitter } from 'events';

import { CompassShell } from './components/compass-shell';
import createPlugin from './plugin';
import CompassShellStore from 'stores';

describe('CompassShellPlugin', () => {
  it('returns a render-able plugin', () => {
    const { Plugin } = createPlugin();

    const wrapper = mount(<Plugin />);
    expect(wrapper.find(CompassShell).exists()).to.equal(true);
  });

  it('returns a CompassShellStore store', () => {
    const { store } = createPlugin();
    const appRegistry = new EventEmitter();
    store.onActivated(appRegistry);
    expect(store).to.be.instanceOf(CompassShellStore);
  });

  it('emits an event on the app registry when it is expanded', () => {
    const { store, Plugin } = createPlugin();

    const appRegistry = new EventEmitter();
    let eventOccured = false;
    appRegistry.on('compass:compass-shell:opened', () => {
      eventOccured = true;
    });

    store.onActivated(appRegistry);

    const wrapper = mount(<Plugin />);
    const shellComponentWrapper = wrapper.find(CompassShell);

    const { emitShellPluginOpened } = shellComponentWrapper.props();
    emitShellPluginOpened();

    expect(eventOccured).to.equal(true);
  });
});

