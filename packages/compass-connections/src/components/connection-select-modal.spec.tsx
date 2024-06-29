import React from 'react';
import sinon from 'sinon';
import { expect } from 'chai';
import { render, screen, cleanup } from '@testing-library/react';
import userEvents from '@testing-library/user-event';
import {
  ConnectionSelectModal,
  type ConnectionSelectModalProps,
} from './connection-select-modal';
import userEvent from '@testing-library/user-event';

const modalProps: ConnectionSelectModalProps = {
  isModalOpen: false,
  descriptionText: '',
  isSubmitDisabled: false,
  submitButtonText: 'Submit',
  connections: [
    {
      id: 'peaches',
      name: 'peaches',
    },
    {
      id: 'turtles',
      name: 'turtles',
    },
  ],
  selectedConnectionId: '',
  onClose: sinon.stub(),
  onSubmit: sinon.stub(),
  onConnectionSelected: sinon.stub(),
};

describe('ConnectionSelectModal Component', function () {
  afterEach(() => {
    sinon.restore();
    cleanup();
  });
  it('should not open the modal when open is false', function () {
    render(<ConnectionSelectModal {...modalProps} />);

    expect(() => screen.getByTestId('select-connection-modal')).to.throw;
  });

  it('should open the modal when open is true with expected contents', function () {
    render(<ConnectionSelectModal {...modalProps} isModalOpen={true} />);

    expect(() => screen.getByTestId('select-connection-modal')).to.not.throw;
    // buttons
    expect(screen.getByText('Submit')).to.exist;
    expect(screen.getByText('Cancel')).to.exist;
    // connections
    expect(screen.getByTestId('connection-select')).to.be.visible;
    userEvent.click(screen.getByTestId('connection-select'));

    expect(screen.getByText('peaches')).to.exist;
    expect(screen.getByText('turtles')).to.exist;
  });

  it('should render the descriptionText when provided', function () {
    render(
      <ConnectionSelectModal
        {...modalProps}
        isModalOpen={true}
        descriptionText="This is description text"
      />
    );

    expect(screen.getByText('This is description text')).to.exist;
  });

  context('when selectedConnectionId is provided', function () {
    it('should render the corresponding option selected', function () {
      render(
        <ConnectionSelectModal
          {...modalProps}
          isModalOpen={true}
          descriptionText="This is description text"
          selectedConnectionId="peaches"
        />
      );

      expect(screen.getByText('peaches')).to.be.visible;
    });
  });

  context('when modal is closed', function () {
    it('should trigger onClose prop', function () {
      const onCloseStub = sinon.stub();
      render(
        <ConnectionSelectModal
          {...modalProps}
          isModalOpen={true}
          onClose={onCloseStub}
        />
      );
      userEvents.click(screen.getByText('Cancel'));
      expect(onCloseStub).to.have.been.called;
    });
  });

  context('when a connection is selected', function () {
    it('should trigger onConnectionSelected prop', function () {
      const onConnectionSelected = sinon.stub();
      render(
        <ConnectionSelectModal
          {...modalProps}
          isModalOpen={true}
          onConnectionSelected={onConnectionSelected}
        />
      );
      userEvent.click(screen.getByTestId('connection-select'));
      userEvents.click(screen.getByText('peaches'));
      expect(onConnectionSelected).to.have.been.calledWithExactly('peaches');
    });
  });

  context('when submit button is clicked', function () {
    it('should trigger onSubmit prop', function () {
      const onSubmitStub = sinon.stub();
      render(
        <ConnectionSelectModal
          {...modalProps}
          isModalOpen={true}
          onSubmit={onSubmitStub}
        />
      );
      userEvents.click(screen.getByText('Submit'));
      expect(onSubmitStub).to.have.been.called;
    });
  });
});
