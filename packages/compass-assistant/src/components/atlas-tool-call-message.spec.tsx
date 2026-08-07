import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ToolUIPart } from 'ai';
import { AtlasToolCallMessage } from './atlas-tool-call-message';

describe('AtlasToolCallMessage', function () {
  const connectionInfo = { id: 'conn-1', name: 'My Cluster' };

  function makeToolCall(
    state: ToolUIPart['state'],
    approvalId: string | undefined = 'approval-1'
  ): ToolUIPart {
    return {
      type: 'tool-atlas-connection-error-debugger',
      toolCallId: 'atlas-tool-call-1',
      state,
      approval: approvalId ? { id: approvalId } : undefined,
    } as unknown as ToolUIPart;
  }

  function renderMessage(
    props: Partial<React.ComponentProps<typeof AtlasToolCallMessage>> = {}
  ) {
    const onApprove = sinon.stub();
    const onDeny = sinon.stub();
    render(
      <AtlasToolCallMessage
        toolCall={makeToolCall('approval-requested')}
        isUserSignedIn={false}
        connectionInfo={connectionInfo}
        onApprove={onApprove}
        onDeny={onDeny}
        {...props}
      />
    );
    return { onApprove, onDeny };
  }

  describe('when awaiting approval and the user is not signed in', function () {
    it('prompts the user to connect to Atlas', function () {
      renderMessage({ isUserSignedIn: false });

      expect(screen.getByText('Connect with Atlas to debug this connection')).to
        .exist;
      expect(screen.getByText('Connect to Atlas')).to.exist;
      expect(screen.getByText('Skip')).to.exist;
    });

    it('calls onApprove with the approval id when confirming', function () {
      const { onApprove } = renderMessage({ isUserSignedIn: false });

      userEvent.click(screen.getByText('Connect to Atlas'));

      expect(onApprove).to.have.been.calledOnceWith('approval-1');
    });

    it('calls onDeny with the approval id when skipping', function () {
      const { onDeny } = renderMessage({ isUserSignedIn: false });

      userEvent.click(screen.getByText('Skip'));

      expect(onDeny).to.have.been.calledOnceWith('approval-1');
    });
  });

  describe('when awaiting approval and the user is signed in', function () {
    it('offers to run the debug tool directly', function () {
      renderMessage({ isUserSignedIn: true });

      expect(screen.getByText('Run Atlas to debug this connection')).to.exist;
      expect(screen.getByText('Run')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
    });

    it('calls onApprove when Run is clicked', function () {
      const { onApprove } = renderMessage({ isUserSignedIn: true });

      userEvent.click(screen.getByText('Run'));

      expect(onApprove).to.have.been.calledOnceWith('approval-1');
    });
  });

  describe('resolved states', function () {
    it('shows the connected title and hides the action buttons when run', function () {
      renderMessage({
        toolCall: makeToolCall('output-available'),
        isUserSignedIn: true,
      });

      expect(screen.getByText('Connected to Atlas')).to.exist;
      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('shows the not-connected title when denied', function () {
      renderMessage({
        toolCall: makeToolCall('output-denied'),
        isUserSignedIn: false,
      });

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
