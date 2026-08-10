import React from 'react';
import { EventEmitter } from 'events';
import {
  createPluginTestHelpers,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { ToolUIPart } from 'ai';
import type {
  AtlasAuthService,
  AtlasUserInfo,
} from '@mongodb-js/atlas-service/provider';
import { CompassAtlasLoginPlugin } from '@mongodb-js/compass-atlas-login-ui';
import { AtlasToolCallMessage } from './atlas-tool-call-message';

/**
 * Minimal fake AtlasAuthService backed by a real EventEmitter, used to drive
 * the compass-atlas-login-ui plugin that owns the sign-in state and actions
 * the card consumes.
 */
class FakeAtlasAuthService extends EventEmitter {
  private user: AtlasUserInfo | null;
  public signIn: sinon.SinonStub;

  constructor({
    signedIn = false,
    signInSucceeds = true,
  }: { signedIn?: boolean; signInSucceeds?: boolean } = {}) {
    super();
    this.user = signedIn ? { sub: 'user-1' } : null;
    this.signIn = sinon.stub().callsFake(() => {
      if (!signInSucceeds) {
        return Promise.reject(new Error('sign-in failed'));
      }
      this.user = { sub: 'user-1' };
      return Promise.resolve(this.user);
    });
  }

  getUserInfo(): Promise<AtlasUserInfo> {
    if (!this.user) {
      return Promise.reject(new Error('not signed in'));
    }
    return Promise.resolve(this.user);
  }
}

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
    props: Partial<React.ComponentProps<typeof AtlasToolCallMessage>> = {},
    {
      signedIn = false,
      signInSucceeds = true,
    }: { signedIn?: boolean; signInSucceeds?: boolean } = {}
  ) {
    const onApprove = sinon.stub();
    const onDeny = sinon.stub();
    const atlasAuthService = new FakeAtlasAuthService({
      signedIn,
      signInSucceeds,
    });
    const { renderWithConnections } = createPluginTestHelpers(
      CompassAtlasLoginPlugin.withMockServices({
        atlasAuthService: atlasAuthService as unknown as AtlasAuthService,
      })
    );
    renderWithConnections(
      <AtlasToolCallMessage
        toolCall={makeToolCall('approval-requested')}
        connectionInfo={connectionInfo}
        onApprove={onApprove}
        onDeny={onDeny}
        {...props}
      />
    );
    return { onApprove, onDeny, atlasAuthService };
  }

  describe('when awaiting approval and the user is not signed in', function () {
    it('prompts the user to connect to Atlas', function () {
      renderMessage();

      expect(screen.getByText('Connect with Atlas to debug this connection')).to
        .exist;
      expect(screen.getByText('Connect to Atlas')).to.exist;
      expect(screen.getByText('Skip')).to.exist;
    });

    it('signs in then calls onApprove with the approval id when confirming', async function () {
      const { onApprove, atlasAuthService } = renderMessage();

      userEvent.click(screen.getByText('Connect to Atlas'));

      await waitFor(() => {
        expect(atlasAuthService.signIn).to.have.been.calledOnce;
      });
      await waitFor(() => {
        expect(onApprove).to.have.been.calledOnceWith('approval-1', true);
      });
    });

    it('denies when sign-in fails', async function () {
      const { onApprove } = renderMessage({}, { signInSucceeds: false });

      userEvent.click(screen.getByText('Connect to Atlas'));

      await waitFor(() => {
        expect(onApprove).to.have.been.calledOnceWith('approval-1', false);
      });
    });

    it('calls onDeny with the approval id when skipping', function () {
      const { onDeny, atlasAuthService } = renderMessage();

      userEvent.click(screen.getByText('Skip'));

      expect(onDeny).to.have.been.calledOnceWith('approval-1');
      expect(atlasAuthService.signIn).to.not.have.been.called;
    });
  });

  describe('when awaiting approval and the user is signed in', function () {
    it('offers to run the debug tool directly', async function () {
      renderMessage({}, { signedIn: true });

      await waitFor(() => {
        expect(screen.getByText('Run')).to.exist;
      });
      expect(screen.getByText('Run Atlas to debug this connection')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
    });

    it('calls onApprove when Run is clicked', async function () {
      const { onApprove } = renderMessage({}, { signedIn: true });

      await waitFor(() => {
        expect(screen.getByText('Run')).to.exist;
      });
      userEvent.click(screen.getByText('Run'));

      await waitFor(() => {
        expect(onApprove).to.have.been.calledOnceWith('approval-1', true);
      });
    });
  });

  describe('resolved states', function () {
    it('shows the connected title and hides the action buttons when run', function () {
      renderMessage(
        { toolCall: makeToolCall('output-available') },
        { signedIn: true }
      );

      expect(screen.getByText('Connected to Atlas')).to.exist;
      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('shows the not-connected title when denied', function () {
      renderMessage({ toolCall: makeToolCall('output-denied') });

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
