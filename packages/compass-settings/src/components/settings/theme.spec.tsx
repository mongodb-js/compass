import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { ThemeSettings } from './theme';

describe('ThemeSettings', function () {
  let container: HTMLElement;
  let onChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    onChangeSpy = spy();
    render(
      <ThemeSettings
        onChange={onChangeSpy}
        preferenceStates={{}}
        themeValue="LIGHT"
      />
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
});
