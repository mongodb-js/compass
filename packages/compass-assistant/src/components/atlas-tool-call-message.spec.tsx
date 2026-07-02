import React from 'react';
import { expect } from 'chai';
import sinon from 'sinon';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import type { AtlasAuthService } from '@mongodb-js/atlas-service/provider';
import type { ToolUIPart } from 'ai';
import { AtlasToolCallMessage } from './atlas-tool-call-message';

function makeApprovalToolCall(): ToolUIPart {
  return {
    type: 'tool-atlas-connection-error-debugger',
    toolCallId: 'tc-1',
    input: { connectionString: 'mongodb://x', errorMessage: 'boom' },
    state: 'approval-requested',
    approval: { id: 'approval-1' },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any;
}

describe('AtlasToolCallMessage', function () {
  it('signs in before approving when the user is not authenticated', async function () {
    const signIn = sinon.stub().resolves({});
    const isAuthenticated = sinon.stub().resolves(false);
    const onApprove = sinon.spy();
    const onDeny = sinon.spy();

    render(
      <AtlasToolCallMessage
        toolCall={makeApprovalToolCall()}
        title="Debug?"
        confirmLabel="Debug with Atlas"
        cancelLabel="Cancel"
        atlasAuthService={
          { isAuthenticated, signIn } as unknown as AtlasAuthService
        }
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );

    await userEvent.click(screen.getByText('Debug with Atlas'));

    await waitFor(() => {
      expect(signIn).to.have.been.calledOnce;
      expect(onApprove).to.have.been.calledOnceWith('approval-1');
    });
    expect(onDeny).to.not.have.been.called;
  });

  it('skips sign-in and approves directly when already authenticated', async function () {
    const signIn = sinon.spy();
    const isAuthenticated = sinon.stub().resolves(true);
    const onApprove = sinon.spy();

    render(
      <AtlasToolCallMessage
        toolCall={makeApprovalToolCall()}
        title="Debug?"
        confirmLabel="Debug with Atlas"
        cancelLabel="Cancel"
        atlasAuthService={
          { isAuthenticated, signIn } as unknown as AtlasAuthService
        }
        onApprove={onApprove}
      />
    );

    await userEvent.click(screen.getByText('Debug with Atlas'));

    await waitFor(() => {
      expect(onApprove).to.have.been.calledOnceWith('approval-1');
    });
    expect(signIn).to.not.have.been.called;
  });

  it('denies the tool when sign-in fails', async function () {
    const signIn = sinon.stub().rejects(new Error('user cancelled'));
    const isAuthenticated = sinon.stub().resolves(false);
    const onApprove = sinon.spy();
    const onDeny = sinon.spy();

    render(
      <AtlasToolCallMessage
        toolCall={makeApprovalToolCall()}
        title="Debug?"
        confirmLabel="Debug with Atlas"
        cancelLabel="Cancel"
        atlasAuthService={
          { isAuthenticated, signIn } as unknown as AtlasAuthService
        }
        onApprove={onApprove}
        onDeny={onDeny}
      />
    );

    await userEvent.click(screen.getByText('Debug with Atlas'));

    await waitFor(() => {
      expect(onDeny).to.have.been.calledOnceWith('approval-1');
    });
    expect(onApprove).to.not.have.been.called;
  });

  it('denies on cancel without invoking sign-in', async function () {
    const signIn = sinon.spy();
    const isAuthenticated = sinon.stub().resolves(false);
    const onDeny = sinon.spy();

    render(
      <AtlasToolCallMessage
        toolCall={makeApprovalToolCall()}
        title="Debug?"
        confirmLabel="Debug with Atlas"
        cancelLabel="Cancel"
        atlasAuthService={
          { isAuthenticated, signIn } as unknown as AtlasAuthService
        }
        onDeny={onDeny}
      />
    );

    await userEvent.click(screen.getByText('Cancel'));

    expect(onDeny).to.have.been.calledOnceWith('approval-1');
    expect(signIn).to.not.have.been.called;
  });
});
