import React from 'react';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';

import ConfirmationModal from './confirmation-modal';

function renderModal() {
  return render(
    <ConfirmationModal title="Pineapples" buttonText="Confirm" open>
      <div data-testid="testing-inner-content">inner content</div>
    </ConfirmationModal>
  );
}

describe('ConfirmationModal Component', function () {
  afterEach(function () {
    cleanup();
  });

  it('should show the modal heading', function () {
    renderModal();
    expect(screen.getByRole('heading')).to.have.text('Pineapples');
  });

  it('should show the modal button', function () {
    renderModal();
    const button = screen.getByText('Confirm').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should show the modal content', function () {
    renderModal();
    const innerContent = screen.getByTestId('testing-inner-content');
    expect(innerContent).to.have.text('inner content');
    expect(innerContent).to.be.visible;
  });
});
