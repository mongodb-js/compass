import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { stub } from 'sinon';
import { Provider } from 'react-redux';
import { GeneralSettings } from './general';
import { configureStore } from '../../stores';
import { fetchSettings } from '../../stores/settings';

describe('GeneralSettings', function () {
  let container: HTMLElement;
  let store: ReturnType<typeof configureStore>;

  function getSettings() {
    return store.getState().settings.settings;
  }

  beforeEach(async function () {
    store = configureStore({ logger: stub() as any });
    await store.dispatch(fetchSettings());
    const component = () => (
      <Provider store={store}>
        <GeneralSettings />
      </Provider>
    );
    render(component());
    container = screen.getByTestId('general-settings');
  });

  afterEach(function () {
    cleanup();
  });

  [
    'readOnly',
    'enableShell',
    'protectConnectionStrings',
    'showKerberosPasswordField',
  ].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`changes ${option} value when option is clicked`, function () {
      const checkbox = within(container).getByTestId(option);
      const initialValue = getSettings()[option];
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(getSettings()).to.have.property(option, !initialValue);
    });
  });

  ['maxTimeMS'].forEach((option) => {
    it(`renders ${option}`, function () {
      expect(within(container).getByTestId(option)).to.exist;
    });
    it(`changes ${option} value when typing in the input`, function () {
      const field = within(container).getByTestId(option);
      userEvent.type(field, '42');
      expect(getSettings()).to.have.property(option, 42);
      userEvent.clear(field);
      expect(getSettings()).to.have.property(option, undefined);
    });
  });
});
