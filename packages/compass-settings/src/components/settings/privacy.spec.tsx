import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';
import { PrivacySettings } from './privacy';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';
import { TelemetryContext } from '@mongodb-js/compass-telemetry/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry/provider';

function renderPrivacySettings(
  store: ReturnType<typeof configureStore>,
  {
    track,
    ...props
  }: Partial<React.ComponentProps<typeof PrivacySettings>> & {
    track?: TrackFunction;
  } = {}
) {
  const component = () => {
    const tree = (
      <Provider store={store}>
        <PrivacySettings {...props} />
      </Provider>
    );
    if (track) {
      return (
        <TelemetryContext.Provider value={track}>
          {tree}
        </TelemetryContext.Provider>
      );
    }
    return tree;
  };
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

    const settings: (keyof ReturnType<typeof getSettings>)[] = [
      'autoUpdates',
      'enableMaps',
      'trackUsageStatistics',
      'enableFeedbackPanel',
    ];
    settings.forEach((option) => {
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

  describe('telemetry', function () {
    let trackSpy: SinonSpy;

    beforeEach(function () {
      trackSpy = spy();
      container = renderPrivacySettings(store, {
        track: trackSpy as unknown as TrackFunction,
      });
    });

    it('tracks a "Setting Changed" event when a setting is toggled', function () {
      const checkbox = within(container).getByTestId('autoUpdates');
      userEvent.click(checkbox, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(trackSpy.calledWith('Setting Changed', { setting: 'autoUpdates' }))
        .to.be.true;
    });

    it('tracks each setting change individually', function () {
      const autoUpdatesCheckbox = within(container).getByTestId('autoUpdates');
      userEvent.click(autoUpdatesCheckbox, undefined, {
        skipPointerEventsCheck: true,
      });

      const enableMapsCheckbox = within(container).getByTestId('enableMaps');
      userEvent.click(enableMapsCheckbox, undefined, {
        skipPointerEventsCheck: true,
      });

      expect(trackSpy.calledWith('Setting Changed', { setting: 'autoUpdates' }))
        .to.be.true;
      expect(trackSpy.calledWith('Setting Changed', { setting: 'enableMaps' }))
        .to.be.true;
      expect(trackSpy.callCount).to.equal(2);
    });
  });
});
