import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';

import { FocusMode } from './focus-mode';
import sinon from 'sinon';

const renderFocusMode = (
  props: Partial<ComponentProps<typeof FocusMode>> = {}
) => {
  render(
    <FocusMode
      isModalOpen={true}
      stageIndex={0}
      stage={{}}
      onCloseModal={() => {}}
      {...props}
    />
  );
};

describe('FocusMode', function () {
  it('does not show modal when closed', function () {
    renderFocusMode({ isModalOpen: false });
    expect(() => {
      screen.getByText(/focus mode/i)
    }).to.throw;
  });

  it('shows modal when open', function () {
    renderFocusMode({ isModalOpen: true });
    expect(screen.getByTestId('modal-title')).to.exist;
  });

  it('calls onCloseModal when close button is clicked', function () {
    const onCloseModal = sinon.spy();
    renderFocusMode({ onCloseModal });

    expect(onCloseModal).to.not.have.been.called;
    screen.getByLabelText(/close modal/i).click();
    expect(onCloseModal).to.have.been.calledOnce;
  });

});