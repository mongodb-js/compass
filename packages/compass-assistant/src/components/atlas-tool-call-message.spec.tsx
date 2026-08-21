import React from 'react';
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
import { AtlasAuthPlugin } from '@mongodb-js/atlas-service/renderer';
import { AtlasToolCallMessage } from './atlas-tool-call-message';

class FakeAtlasAuthService {
  private user: AtlasUserInfo | null;
  public signIn: sinon.SinonStub;

  constructor({
    signedIn = false,
    signInSucceeds = true,
  }: { signedIn?: boolean; signInSucceeds?: boolean } = {}) {
    this.user = signedIn ? { sub: 'user-1' } : null;
    this.signIn = sinon.stub().callsFake(() => {
      if (!signInSucceeds) {
        return Promise.reject(new Error('sign-in failed'));
      }
      this.user = { sub: 'user-1' };
      return Promise.resolve(this.user);
    });
  }

  isAuthenticated(): Promise<boolean> {
    return Promise.resolve(!!this.user);
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
    approvalId: string | undefined = 'approval-1',
    output?: unknown
  ): ToolUIPart {
    return {
      type: 'tool-atlas-connection-error-debugger',
      toolCallId: 'atlas-tool-call-1',
      state,
      approval: approvalId ? { id: approvalId } : undefined,
      output,
    } as unknown as ToolUIPart;
  }

  const debugResultOutput = {
    clusterName: 'Cluster0',
    clusterState: 'PAUSED',
    ipAccessStatus: 'Client IP Allowed',
  };

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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      AtlasAuthPlugin.withMockServices({
        atlasAuthService: atlasAuthService as unknown as AtlasAuthService,
      })
    );
    const { container, track } = renderWithConnections(
      <AtlasToolCallMessage
        toolCall={makeToolCall('approval-requested')}
        connectionInfo={connectionInfo}
        onApprove={onApprove}
        onDeny={onDeny}
        {...props}
      />
    );
    return { onApprove, onDeny, atlasAuthService, container, track };
  }

  describe('when awaiting approval and the user is not signed in', function () {
    it('prompts the user to connect to Atlas', function () {
      renderMessage();

      expect(screen.getByText('Connect with Atlas to debug this connection?'))
        .to.exist;
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

    it('tracks the sign in prompt once, with the tool name as entrypoint', async function () {
      const { track } = renderMessage();

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Atlas Sign In Prompt Shown', {
          entrypoint: 'assistant-tool-atlas-connection-error-debugger',
        });
      });
      expect(
        track
          .getCalls()
          .filter((call) => call.args[0] === 'Atlas Sign In Prompt Shown')
      ).to.have.lengthOf(1);
    });

    it('tracks sign in started with the tool name as entrypoint', async function () {
      const { track } = renderMessage();

      userEvent.click(screen.getByText('Connect to Atlas'));

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Atlas Sign In Started', {
          entrypoint: 'assistant-tool-atlas-connection-error-debugger',
        });
      });
    });

    it('derives the entrypoint from the tool that requested sign in', async function () {
      const { track } = renderMessage({
        toolCall: {
          type: 'tool-atlas-some-future-tool',
          toolCallId: 'atlas-tool-call-2',
          state: 'approval-requested',
          approval: { id: 'approval-1' },
        } as unknown as ToolUIPart,
      });

      await waitFor(() => {
        expect(track).to.have.been.calledWith('Atlas Sign In Prompt Shown', {
          entrypoint: 'assistant-tool-atlas-some-future-tool',
        });
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
      expect(screen.getByText('Run Atlas to debug this connection?')).to.exist;
      expect(screen.getByText('Cancel')).to.exist;
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
    });

    it('does not track a sign in prompt', async function () {
      const { track } = renderMessage({}, { signedIn: true });

      await waitFor(() => {
        expect(screen.getByText('Run')).to.exist;
      });
      expect(track).to.not.have.been.calledWith('Atlas Sign In Prompt Shown');
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
    it('shows "Ran" title and hides the action buttons when run', function () {
      const { container } = renderMessage(
        { toolCall: makeToolCall('output-available') },
        { signedIn: true }
      );

      expect(container).to.contain.text('Ran atlas-connection-error-debugger');
      expect(screen.queryByText('Run')).to.not.exist;
      expect(screen.queryByText('Cancel')).to.not.exist;
    });

    it('shows "Cancelled" title and hides the action buttons when denied', function () {
      const { container } = renderMessage({
        toolCall: makeToolCall('output-denied'),
      });

      expect(container).to.contain.text(
        'Cancelled atlas-connection-error-debugger'
      );
      expect(screen.queryByText('Connect to Atlas')).to.not.exist;
      expect(screen.queryByText('Skip')).to.not.exist;
    });
  });

  it('displays the connection chip for atlas-connection-error-debugger', function () {
    renderMessage();

    expect(screen.getByText(connectionInfo.name)).to.exist;
  });

  describe('custom tool result', function () {
    it('renders the custom tool result once the debugger tool has output', function () {
      renderMessage(
        {
          toolCall: makeToolCall(
            'output-available',
            undefined,
            debugResultOutput
          ),
        },
        { signedIn: true }
      );

      // The mapped Atlas debug result is surfaced via SuggestedActions.
      expect(screen.getByText('Cluster0')).to.exist;
    });

    it('does not render the custom tool result while awaiting approval', function () {
      renderMessage({
        toolCall: makeToolCall('approval-requested', 'approval-1'),
      });

      expect(screen.queryByText('Cluster0')).to.not.exist;
    });
  });
});
