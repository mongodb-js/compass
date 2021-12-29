import React from 'react';
import { cleanup, render, screen, fireEvent } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';

import ConfirmEditConnectionStringModal from './confirm-edit-connection-string';

function renderModal(onCancel: () => void, onConfirm: () => void) {
  return render(
    <ConfirmEditConnectionStringModal
      onCancel={onCancel}
      onConfirm={onConfirm}
      open
    />
  );
}

describe('ConfirmationModal Component', function () {
  let onConfirmSpy;
  let onCancelSpy;
  beforeEach(function () {
    onConfirmSpy = sinon.spy();
    onCancelSpy = sinon.spy();

    renderModal(onCancelSpy, onConfirmSpy);
  });

  afterEach(function () {
    onConfirmSpy = null;
    onCancelSpy = null;
    cleanup(); // Modals can sometimes leave behind animations and focus traps.
  });

  it('should show the modal heading', function () {
    expect(screen.getByRole('heading')).to.have.text(
      'Are you sure you want to edit your connection string?'
    );
  });

  it('should show the modal button', function () {
    const button = screen.getByText('Confirm').closest('button');
    expect(button).to.not.match('disabled');
  });

  it('should show the modal content', function () {
    const innerContent = screen.getByTestId('edit-uri-note');
    expect(innerContent).to.have.text(
      'Editing this connection string will reveal your credentials.'
    );
    expect(innerContent).to.be.visible;
  });

  it('calls the onConfirm prop when confirm is clicked', function () {
    const button = screen.getByText('Confirm').closest('button');

    expect(onConfirmSpy.called).to.equal(false);

    fireEvent(
      button,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(onConfirmSpy.called).to.equal(true);
    expect(onCancelSpy.called).to.equal(false);
  });

  it('calls the onCancel prop when close is clicked', function () {
    const button = screen.getByText('Cancel').closest('button');

    expect(onCancelSpy.called).to.equal(false);

    fireEvent(
      button,
      new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
      })
    );

    expect(onCancelSpy.called).to.equal(true);
    expect(onConfirmSpy.called).to.equal(false);
  });
});
