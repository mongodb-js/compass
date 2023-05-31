import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import { fireEvent, render, screen, cleanup } from '@testing-library/react';

import { MoreOptionsToggle } from './more-options-toggle';

function renderMoreOptionsToggle(
  props?: Partial<React.ComponentProps<typeof MoreOptionsToggle>>
) {
  return render(
    <MoreOptionsToggle
      isExpanded={false}
      aria-controls="test"
      onToggleOptions={() => {}}
      {...props}
    />
  );
}

describe('MoreOptionsToggle Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should call to open the options dropdown on click', function () {
    const onToggleOptionsSpy = sinon.spy();
    renderMoreOptionsToggle({
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
    renderMoreOptionsToggle({
      isExpanded: true,
      onToggleOptions: onToggleOptionsSpy,
    });

    expect(onToggleOptionsSpy.calledOnce).to.be.false;
    const button = screen.getByText('Fewer Options');
    fireEvent.click(button);
    expect(onToggleOptionsSpy.calledOnce).to.be.true;
  });

  it('should the test id', function () {
    renderMoreOptionsToggle({
      'data-testid': 'pineapple',
    });

    expect(screen.getByTestId('pineapple')).to.be.visible;
  });
});
