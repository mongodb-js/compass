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
import { PrivacySettings } from './privacy';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

function renderPrivacySettings(
  store,
  props: Partial<React.ComponentProps<typeof PrivacySettings>> = {}
) {
  const component = () => (
    <Provider store={store}>
      <PrivacySettings {...props} />
    </Provider>
  );
  render(component());
  return screen.getByTestId('privacy-settings');
}

describe('PrivacySettings', function () {
  let container: HTMLElement;
  let store: ReturnType<typeof configureStore>;

  function getSettings() {
    return store.getState().settings.settings;
  }

  beforeEach(async function () {
    store = configureStore();
    await store.dispatch(fetchSettings());
  });

  afterEach(function () {
    cleanup();
  });

  describe('when rendered', function () {
    beforeEach(function () {
      container = renderPrivacySettings(store);
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
});
