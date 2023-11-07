import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { stub } from 'sinon';
import { Provider } from 'react-redux';
import { PrivacySettings } from './privacy';
import { configureStore } from '../../stores';
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
    store = configureStore({ logger: stub() as any });
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

  it('does not render enableGenAIFeatures when isAIFeatureRolledOutToUser is false', function () {
    container = renderPrivacySettings(store, {
      isAIFeatureRolledOutToUser: false,
    });
    expect(within(container).queryByTestId('enableGenAIFeatures')).to.not.exist;
  });

  it('renders enableGenAIFeatures when GisAIFeatureRolledOutToUser is true', function () {
    container = renderPrivacySettings(store, {
      isAIFeatureRolledOutToUser: true,
    });
    expect(within(container).getByTestId('enableGenAIFeatures')).to.be.visible;
  });
});
