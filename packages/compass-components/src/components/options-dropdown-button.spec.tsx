import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import { OptionsDropdownButton } from './options-dropdown-button';

function renderOptionsDropdown(
  props?: Partial<React.ComponentProps<typeof OptionsDropdownButton>>
) {
  return render(
    <OptionsDropdownButton
      isExpanded={false}
      aria-controls="test"
      onToggleOptions={() => {}}
      {...props}
    />
  );
}

describe('OptionsDropdownButton Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should call to open the options dropdown on click', function () {
    const onToggleOptionsSpy = sinon.spy();
    renderOptionsDropdown({
      isExpanded: false,
      onToggleOptions: onToggleOptionsSpy,
    });

    expect(onToggleOptionsSpy.calledOnce).to.be.false;
    const button = screen.getByText('More Options');
    fireEvent.click(button);
    expect(onToggleOptionsSpy.calledOnce).to.be.true;
  });

  it('should call to close the options dropdown on click', function () {
    const onToggleOptionsSpy = sinon.spy();
    renderOptionsDropdown({
      isExpanded: true,
      onToggleOptions: onToggleOptionsSpy,
    });

    expect(onToggleOptionsSpy.calledOnce).to.be.false;
    const button = screen.getByText('Less Options');
    fireEvent.click(button);
    expect(onToggleOptionsSpy.calledOnce).to.be.true;
  });

  it('should the test id', function () {
    renderOptionsDropdown({
      'data-testid': 'pineapple',
    });

    expect(screen.getByTestId('pineapple')).to.be.visible;
  });
});
