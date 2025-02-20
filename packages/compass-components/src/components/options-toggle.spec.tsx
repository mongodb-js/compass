import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';

import {
  fireEvent,
  render,
  screen,
  cleanup,
} from '@mongodb-js/testing-library-compass';

import { OptionsToggle } from './options-toggle';

function renderOptionsToggle(
  props?: Partial<React.ComponentProps<typeof OptionsToggle>>
) {
  return render(
    <OptionsToggle
      isExpanded={false}
      aria-controls="test"
      onToggleOptions={() => {}}
      {...props}
    />
  );
}

describe('OptionsToggle Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should call to open the options dropdown on click', function () {
    const onToggleOptionsSpy = sinon.spy();
    renderOptionsToggle({
      isExpanded: false,
      onToggleOptions: onToggleOptionsSpy,
    });

    expect(onToggleOptionsSpy.calledOnce).to.be.false;
    const button = screen.getByText('Options');
    fireEvent.click(button);
    expect(onToggleOptionsSpy.calledOnce).to.be.true;
  });

  it('should call to close the options dropdown on click', function () {
    const onToggleOptionsSpy = sinon.spy();
    renderOptionsToggle({
      isExpanded: true,
      onToggleOptions: onToggleOptionsSpy,
    });

    expect(onToggleOptionsSpy.calledOnce).to.be.false;
    const button = screen.getByText('Options');
    fireEvent.click(button);
    expect(onToggleOptionsSpy.calledOnce).to.be.true;
  });

  it('should the test id', function () {
    renderOptionsToggle({
      'data-testid': 'pineapple',
    });

    expect(screen.getByTestId('pineapple')).to.be.visible;
  });
});
