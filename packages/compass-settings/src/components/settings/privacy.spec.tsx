import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { PrivacySettings } from './privacy';
import { configureStore } from '../../stores';
import { fetchSettings } from '../../stores/settings';

describe('PrivacySettings', function () {
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
        <PrivacySettings />
      </Provider>
    );
    render(component());
    container = screen.getByTestId('privacy-settings');
  });

  afterEach(function () {
    cleanup();
  });

  [
    'autoUpdates',
    'enableMaps',
    'trackUsageStatistics',
    'enableFeedbackPanel',
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
});
