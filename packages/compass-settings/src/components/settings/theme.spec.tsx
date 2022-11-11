import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { ThemeSettings } from './theme';

describe('ThemeSettings', function () {
  let container: HTMLElement;
  let handleChangeSpy: sinon.SinonSpy;

  beforeEach(function () {
    handleChangeSpy = spy();
    render(
      <ThemeSettings
        handleChange={handleChangeSpy}
        preferenceStates={{}}
        themeValue="LIGHT"
      />
    );
    container = screen.getByTestId('theme-settings');
  });

  it('calls handleChange when choosing the OS sync checkbox', function () {
    expect(handleChangeSpy.calledOnce).to.be.false;
    const checkbox = within(container).getByTestId('use-os-theme');
    userEvent.click(checkbox, undefined, {
      skipPointerEventsCheck: true,
    });
    expect(handleChangeSpy.calledWith('theme', 'OS_THEME')).to.be.true;
  });

  it('calls handleChange when picking another theme', function () {
    expect(handleChangeSpy.calledOnce).to.be.false;
    const radio = within(container).getByTestId('theme-selector-dark');
    userEvent.click(radio, undefined, {
      skipPointerEventsCheck: true,
    });
    expect(handleChangeSpy.calledWith('theme', 'DARK')).to.be.true;
  });
});
