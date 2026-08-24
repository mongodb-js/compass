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
import { GeneralSettings } from './general';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

describe('GeneralSettings', function () {
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
        <GeneralSettings />
      </Provider>
    );
    render(component());
    container = screen.getByTestId('general-settings');
  });

  afterEach(function () {
    cleanup();
  });

  const settings: (keyof ReturnType<typeof getSettings>)[] = [
    'readOnly',
    'enableShell',
    'protectConnectionStrings',
    'showKerberosPasswordField',
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

  it('renders defaultSortOrder', function () {
    expect(within(container).getByTestId('defaultSortOrder')).to.exist;
  });

  it('changes defaultSortOrder value when selecting an option', function () {
    within(container).getByTestId('defaultSortOrder').click();
    within(container).getByText('_id: 1').click();
    expect(getSettings()).to.have.property('defaultSortOrder', '{ _id: 1 }');
  });

  it('renders legacyUUIDDisplayEncoding', function () {
    expect(within(container).getByTestId('legacyUUIDDisplayEncoding')).to.exist;
  });

  it('changes legacyUUIDDisplayEncoding value when selecting an option', function () {
    within(container).getByTestId('legacyUUIDDisplayEncoding').click();
    within(container).getByText('Legacy Java UUID').click();
    expect(getSettings()).to.have.property(
      'legacyUUIDDisplayEncoding',
      'LegacyJavaUUID'
    );
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

  context('timezone', function () {
    let timezoneContainer: HTMLElement;

    function getTimezoneInput() {
      const input = within(timezoneContainer).getByLabelText(
        'Personal timezone display preference'
      ) as HTMLInputElement | null;
      if (!input) {
        throw new Error('Could not find timezone input');
      }
      return input;
    }

    function selectTimezone(timezone: string) {
      const input = getTimezoneInput();
      userEvent.click(input);
      userEvent.clear(input);
      userEvent.type(input, timezone);
      // The menu is rendered in a portal, outside of the settings container.
      const menu = document.querySelector(
        `#${input.getAttribute('aria-controls') as string}`
      ) as HTMLElement;
      userEvent.click(
        within(menu).getByRole('option', { name: new RegExp(timezone, 'i') }),
        undefined,
        { skipPointerEventsCheck: true }
      );
      userEvent.keyboard('{Escape}');
    }

    function getTimezoneDescription() {
      return within(timezoneContainer).getByTestId(
        'timezone-description'
      ).textContent;
    }

    beforeEach(function () {
      expect(getSettings()).to.have.property('timezone', 'UTC');

      timezoneContainer = within(container).getByTestId('setting-timezone');
      expect(timezoneContainer).to.exist;
    });

    it('explains where the data is stored', function () {
      expect(getTimezoneDescription()).to.match(
        /the data will still always be stored in utc\./i
      );
    });

    it('defaults to UTC and does not show daylight savings text', function () {
      expect(getTimezoneInput().value).to.equal('UTC+00:00');
      expect(getSettings()).to.have.property('timezone', 'UTC');
      expect(getTimezoneDescription()).to.not.match(
        /observes daylight savings/i
      );
    });

    it('changes the value of timezone - no daylight saving timezone', function () {
      selectTimezone('Africa/Algiers');

      expect(getSettings()).to.have.property('timezone', 'Africa/Algiers');
      expect(getTimezoneInput().value).to.include('Africa/Algiers');
      expect(getTimezoneDescription()).to.not.match(
        /observes daylight savings/i
      );
    });

    it('changes the value of timezone - daylight saving timezone', function () {
      selectTimezone('Europe/Berlin');

      expect(getSettings()).to.have.property('timezone', 'Europe/Berlin');
      expect(getTimezoneInput().value).to.include('Europe/Berlin');
      expect(getTimezoneDescription()).to.match(/observes daylight savings/i);
    });
  });
});
