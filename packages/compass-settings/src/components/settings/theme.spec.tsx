import React from 'react';
import {
  cleanup,
  render,
  screen,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { spy } from 'sinon';
import { expect } from 'chai';

import { Provider } from 'react-redux';
import { ThemeSettings } from './theme';
import configureStore from '../../../test/configure-store';
import { fetchSettings } from '../../stores/settings';

describe('ThemeSettings', function () {
  let container: HTMLElement;
  let onChangeSpy: sinon.SinonSpy;
  let store: ReturnType<typeof configureStore>;

  beforeEach(async function () {
    onChangeSpy = spy();
    store = configureStore();
    await store.dispatch(fetchSettings());
    render(
      <Provider store={store}>
        <ThemeSettings
          onChange={onChangeSpy}
          preferenceStates={{}}
          themeValue="LIGHT"
        />
      </Provider>
    );
    container = screen.getByTestId('theme-settings');
  });

  afterEach(function () {
    cleanup();
  });

  it('calls onChange when choosing the OS sync checkbox', function () {
    expect(onChangeSpy.calledOnce).to.be.false;
    const checkbox = within(container).getByTestId('use-os-theme');
    userEvent.click(checkbox, undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onChangeSpy.calledWith('theme', 'OS_THEME')).to.be.true;
  });

  it('calls onChange when picking another theme', function () {
    expect(onChangeSpy.calledOnce).to.be.false;
    const radio = within(container).getByTestId('theme-selector-dark');
    userEvent.click(radio, undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onChangeSpy.calledWith('theme', 'DARK')).to.be.true;
  });

  it('changes shellFollowsCompassTheme value when option is clicked', function () {
    const checkbox = within(container).getByTestId('shellFollowsCompassTheme');
    expect(store.getState().settings.settings.shellFollowsCompassTheme).to.be
      .false;
    userEvent.click(checkbox, undefined, {
      skipPointerEventsCheck: true,
    });
    expect(store.getState().settings.settings.shellFollowsCompassTheme).to.be
      .true;
  });
});
