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
import { OIDCSettings } from './oidc-settings';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

describe('OIDCSettings', function () {
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
        <OIDCSettings />
      </Provider>
    );
    render(component());
    container = screen.getByTestId('oidc-settings');
  });

  afterEach(function () {
    cleanup();
  });

  ['showOIDCDeviceAuthFlow', 'persistOIDCTokens'].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`changed ${option} value when option is clicked`, function () {
      const checkbox = within(container).getByTestId(option);
      const initialValue = getSettings()[option];
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(getSettings()).to.have.property(option, !initialValue);
    });
  });
});
