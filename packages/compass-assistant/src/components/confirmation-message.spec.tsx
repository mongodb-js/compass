import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { ConfirmationMessage } from './confirmation-message';
import { expect } from 'chai';
import sinon from 'sinon';

describe('ConfirmationMessage', function () {
  const defaultProps = {
    state: 'pending' as const,
    title: 'Test Confirmation',
    description: 'Are you sure you want to proceed with this action?',
    onConfirm: () => {},
    onReject: () => {},
  };

  it('renders title and description', function () {
    render(<ConfirmationMessage {...defaultProps} />);

    expect(screen.getByText(defaultProps.title)).to.exist;
    expect(screen.getByText(defaultProps.description)).to.exist;
  });

  describe('pending state', function () {
    it('shows confirm and cancel buttons', function () {
      const onConfirm = sinon.stub();
      const onReject = sinon.stub();

      render(
        <ConfirmationMessage
          {...defaultProps}
          state="pending"
          onConfirm={onConfirm}
          onReject={onReject}
        />
      );

      expect(screen.getByText('Confirm')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
    });

    it('calls onConfirm when confirm button is clicked', function () {
      const onConfirm = sinon.stub();
      const onReject = sinon.stub();

      render(
        <ConfirmationMessage
          {...defaultProps}
          state="pending"
          onConfirm={onConfirm}
          onReject={onReject}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      userEvent.click(confirmButton);

      expect(onConfirm.calledOnce).to.be.true;
      expect(onReject.notCalled).to.be.true;
    });

    it('calls onReject when cancel button is clicked', function () {
      const onConfirm = sinon.stub();
      const onReject = sinon.stub();

      render(
        <ConfirmationMessage
          {...defaultProps}
          state="pending"
          onConfirm={onConfirm}
          onReject={onReject}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      userEvent.click(cancelButton);

      expect(onReject.calledOnce).to.be.true;
      expect(onConfirm.notCalled).to.be.true;
    });

    it('does not show status when in pending state', function () {
      render(
        <ConfirmationMessage
          {...defaultProps}
          state="pending"
          onConfirm={sinon.stub()}
        />
      );

      expect(screen.queryByText('Request confirmed')).to.not.exist;
      expect(screen.queryByText('Request cancelled')).to.not.exist;
    });
  });

  describe('confirmed and rejected states', function () {
    it('shows confirmed status with checkmark icon', function () {
      render(<ConfirmationMessage {...defaultProps} state="confirmed" />);

      expect(screen.getByText('Request confirmed')).to.exist;
      // sic from the icon library
      expect(screen.getByLabelText('Checkmark With Circle Icon')).to.exist;

      expect(screen.queryByText('Confirm')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('shows cancelled status', function () {
      render(<ConfirmationMessage {...defaultProps} state="rejected" />);

      expect(screen.getByText('Request cancelled')).to.exist;
      // sic from the icon library
      expect(screen.getByLabelText('XWith Circle Icon')).to.exist;

      expect(screen.queryByText('Confirm')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });
  });
});
