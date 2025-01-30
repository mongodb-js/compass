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

  it('renders defaultSortOrder', function () {
    expect(within(container).getByTestId('defaultSortOrder')).to.exist;
  });

  it('changes defaultSortOrder value when selecting an option', function () {
    const select = within(container).getByTestId('defaultSortOrder');
    userEvent.selectOptions(select, '_id: 1 (in ascending order by creation)');
    expect(getSettings()).to.have.property('defaultSortOrder', '{ _id: 1 }');
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
