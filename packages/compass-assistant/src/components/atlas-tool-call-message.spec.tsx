import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import { AtlasToolCallMessage } from './atlas-tool-call-message';

describe('AtlasToolCallMessage', function () {
  const connectionInfo = { id: 'conn-1', name: 'My Cluster' };

  function renderMessage(
    props: Partial<React.ComponentProps<typeof AtlasToolCallMessage>> = {}
  ) {
    const onConfirm = sinon.stub();
    const onReject = sinon.stub();
    render(
      <AtlasToolCallMessage
        state="pending"
        isUserSignedIn={false}
        description="Debug this connection"
        connectionInfo={connectionInfo}
        onConfirm={onConfirm}
        onReject={onReject}
        {...props}
      />
    );
    return { onConfirm, onReject };
  }

  describe('when the user is not signed in', function () {
    it('prompts the user to connect to Atlas', function () {
      renderMessage({ isUserSignedIn: false });

      expect(screen.getByText('Connect with Atlas to debug this connection')).to
        .exist;
      expect(screen.getByText('Connect to Atlas')).to.exist;
      expect(screen.getByText('Skip')).to.exist;
    });

    it('calls onConfirm when the primary button is clicked', function () {
      const { onConfirm } = renderMessage({ isUserSignedIn: false });

      userEvent.click(screen.getByText('Connect to Atlas'));

      expect(onConfirm).to.have.been.calledOnce;
    });

    it('calls onReject when the secondary button is clicked', function () {
      const { onReject } = renderMessage({ isUserSignedIn: false });

      userEvent.click(screen.getByText('Skip'));

      expect(onReject).to.have.been.calledOnce;
    });
  });

  describe('when the user is signed in', function () {
    it('offers to run the debug tool directly', function () {
      renderMessage({ isUserSignedIn: true });

      expect(screen.getByText('Run Atlas to debug this connection')).to.exist;
      expect(screen.getByText('Run')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
      // Should not show the connect-focused wording.
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
    });

    it('calls onConfirm when Run is clicked', function () {
      const { onConfirm } = renderMessage({ isUserSignedIn: true });

      userEvent.click(screen.getByText('Run'));

      expect(onConfirm).to.have.been.calledOnce;
    });
  });

  describe('resolved states', function () {
    it('shows the confirmed title and hides the action buttons', function () {
      renderMessage({ state: 'confirmed', isUserSignedIn: true });

      expect(screen.getByText('Connected to Atlas')).to.exist;
      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('shows the not-connected title and hides the action buttons', function () {
      renderMessage({ state: 'rejected', isUserSignedIn: false });

      expect(screen.getByText('Not connected to Atlas')).to.exist;
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
      expect(screen.queryByText('Skip')).to.not.exist;
    });
  });

  it('renders the connection name as a chip', function () {
    renderMessage();
    expect(screen.getByText('My Cluster')).to.exist;
  });
});
