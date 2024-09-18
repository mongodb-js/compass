import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { ProxySettings } from './proxy-settings';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';
import { proxyPreferenceToProxyOptions } from 'compass-preferences-model';

describe('ProxyOptions', function () {
  let container: HTMLElement;
  let store: ReturnType<typeof configureStore>;

  function getSettings() {
    return store.getState().settings.settings;
  }

  beforeEach(async function () {
    store = configureStore();
    await store.dispatch(fetchSettings());
    const component = () => (
      <Provider store={store}>
        <ProxySettings />
      </Provider>
    );
    render(component());
    container = screen.getByTestId('proxy-settings');
  });

  afterEach(function () {
    cleanup();
  });

  for (const [option, expected] of [
    ['no-proxy', { useEnvironmentVariableProxies: false }],
    ['env', { useEnvironmentVariableProxies: true }],
    ['custom', { proxy: '', useEnvironmentVariableProxies: true }],
  ] as const) {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option + '-radio')).to.exist;
    });
    it(`changed ${option} value when option is clicked`, function () {
      const button = within(container).getByTestId(option + '-radio');
      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      const proxyOptions = proxyPreferenceToProxyOptions(getSettings().proxy);
      expect(proxyOptions).to.deep.equal(expected);
    });
  }

  it('allows setting a no-proxy host list', function () {
    const textbox = within(container).getByTestId('proxy-no-proxy-hosts');
    userEvent.type(textbox, 'localhost,example.com');
    const proxyOptions = proxyPreferenceToProxyOptions(getSettings().proxy);
    expect(proxyOptions).to.deep.equal({
      noProxyHosts: 'localhost,example.com',
      useEnvironmentVariableProxies: true,
    });
  });
});
