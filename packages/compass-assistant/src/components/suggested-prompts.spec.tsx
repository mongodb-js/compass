import React from 'react';
import {
  render,
  screen,
  userEvent,
  waitFor,
} from '@mongodb-js/testing-library-compass';
import { SuggestedPrompts } from './suggested-prompts';
import { expect } from 'chai';
import sinon from 'sinon';
import { createMockChat } from '../../test/utils';
import type { AssistantMessage } from '../compass-assistant-provider';
import {
  AssistantGlobalStateProvider,
  useSyncAssistantGlobalState,
} from '../assistant-global-state';
import type {
  WorkspaceTab,
  CollectionSubtab,
} from '@mongodb-js/workspace-info';

describe('SuggestedPrompts', function () {
  let onMessageSendStub: sinon.SinonStub;

  beforeEach(function () {
    onMessageSendStub = sinon.stub();
  });

  function TestWrapper({
    children,
    activeWorkspace,
    activeCollectionSubTab,
  }: {
    children: React.ReactNode;
    activeWorkspace?: WorkspaceTab;
    activeCollectionSubTab?: CollectionSubtab | null;
  }) {
    useSyncAssistantGlobalState('activeWorkspace', activeWorkspace ?? null);
    useSyncAssistantGlobalState(
      'activeCollectionSubTab',
      activeCollectionSubTab ?? null
    );
    return <>{children}</>;
  }

  function renderSuggestedPrompts({
    messages = [],
    activeWorkspace,
    activeCollectionSubTab,
  }: {
    messages?: AssistantMessage[];
    activeWorkspace?: WorkspaceTab;
    activeCollectionSubTab?: CollectionSubtab | null;
  }) {
    const chat = createMockChat({ messages });
    return render(
      <AssistantGlobalStateProvider>
        <TestWrapper
          activeWorkspace={activeWorkspace}
          activeCollectionSubTab={activeCollectionSubTab}
        >
          <SuggestedPrompts chat={chat} onMessageSend={onMessageSendStub} />
        </TestWrapper>
      </AssistantGlobalStateProvider>
    );
  }

  function createCollectionWorkspace(
    namespace = 'test.collection'
  ): WorkspaceTab {
    return { type: 'Collection', namespace } as WorkspaceTab;
  }

  describe('visibility', function () {
    it('renders default prompts when chat is empty', function () {
      renderSuggestedPrompts({ messages: [] });
      expect(screen.getByText('Suggested Actions')).to.exist;
      expect(screen.getByText('How do I connect to my MongoDB deployment?')).to
        .exist;
    });

    it('does not render when chat has messages', function () {
      const messages: AssistantMessage[] = [
        { id: '1', role: 'user', parts: [{ type: 'text', text: 'Hello' }] },
      ];
      renderSuggestedPrompts({ messages });
      expect(screen.queryByText('Suggested Actions')).to.not.exist;
    });

    it('renders multiple prompts', function () {
      renderSuggestedPrompts({});
      const prompts = screen.getAllByTestId(/suggested-action-\d+/);
      expect(prompts.length).to.be.greaterThan(0);
    });
  });

  describe('prompt selection and interaction', function () {
    it('calls onMessageSend when a prompt is clicked', async function () {
      renderSuggestedPrompts({});

      const firstPrompt = screen.getByTestId('suggested-action-0');
      userEvent.click(firstPrompt);

      await waitFor(() => {
        expect(onMessageSendStub.calledOnce).to.be.true;
        expect(onMessageSendStub.firstCall.args[0]).to.equal(
          'What can I do with MongoDB Compass, and what are some usage tips?'
        );
      });
    });

    it('marks prompt as selected when clicked', async function () {
      renderSuggestedPrompts({});

      const prompt = screen.getByTestId('suggested-action-0');
      userEvent.click(prompt);

      await waitFor(() => {
        expect(prompt.getAttribute('aria-pressed')).to.equal('true');
      });
    });

    it('resets selection state when workspace changes', async function () {
      const { rerender } = renderSuggestedPrompts({
        activeWorkspace: { type: 'Databases' } as WorkspaceTab,
      });

      const prompt = screen.getByTestId('suggested-action-0');
      userEvent.click(prompt);

      await waitFor(() => {
        expect(onMessageSendStub.calledOnce).to.be.true;
      });

      rerender(
        <AssistantGlobalStateProvider>
          <TestWrapper
            activeWorkspace={createCollectionWorkspace()}
            activeCollectionSubTab="Documents"
          >
            <SuggestedPrompts
              chat={createMockChat({ messages: [] })}
              onMessageSend={onMessageSendStub}
            />
          </TestWrapper>
        </AssistantGlobalStateProvider>
      );

      const newPrompt = screen.getByTestId('suggested-action-0');
      expect(newPrompt.getAttribute('aria-pressed')).to.equal('false');
    });
  });

  describe('context-based prompt selection', function () {
    it('shows different prompts for collection subtabs', function () {
      const { rerender } = renderSuggestedPrompts({
        activeWorkspace: createCollectionWorkspace(),
        activeCollectionSubTab: 'Documents',
      });

      expect(
        screen.getByText(
          'How can I modify or delete multiple documents at once?'
        )
      ).to.exist;

      rerender(
        <AssistantGlobalStateProvider>
          <TestWrapper
            activeWorkspace={createCollectionWorkspace()}
            activeCollectionSubTab="Aggregations"
          >
            <SuggestedPrompts
              chat={createMockChat({ messages: [] })}
              onMessageSend={onMessageSendStub}
            />
          </TestWrapper>
        </AssistantGlobalStateProvider>
      );

      expect(screen.getByText('What is an aggregation pipeline?')).to.exist;
      expect(
        screen.queryByText(
          'How can I modify or delete multiple documents at once?'
        )
      ).to.not.exist;
    });

    it('falls back to generic prompts for unknown contexts', function () {
      renderSuggestedPrompts({
        activeWorkspace: createCollectionWorkspace(),
        activeCollectionSubTab: 'UnknownSubTab' as CollectionSubtab,
      });

      expect(
        screen.getByText(
          'What can I do with MongoDB Compass, and what are some usage tips?'
        )
      ).to.exist;
      expect(screen.getByText('How do I connect to my MongoDB deployment?')).to
        .exist;
    });

    it('shows workspace-specific prompts for Data Modeling', function () {
      renderSuggestedPrompts({
        activeWorkspace: { type: 'Data Modeling' } as WorkspaceTab,
      });

      expect(
        screen.getByText(
          'What are some MongoDB data modeling best practices and anti-patterns?'
        )
      ).to.exist;
      expect(
        screen.getByText(
          'Can I plan changes to my data model without affecting actual data?'
        )
      ).to.exist;
    });
  });

  describe('metadata handling', function () {
    it('sends message without metadata when none exists', async function () {
      renderSuggestedPrompts({});

      const prompt = screen.getByTestId('suggested-action-0');
      userEvent.click(prompt);

      await waitFor(() => {
        expect(onMessageSendStub.calledOnce).to.be.true;
        const metadataArg = onMessageSendStub.firstCall.args[1];
        expect(metadataArg.metadata).to.be.undefined;
      });
    });

    it('sends full message with displayText metadata for performance prompts', async function () {
      renderSuggestedPrompts({
        activeWorkspace: createCollectionWorkspace(),
        activeCollectionSubTab: 'Documents',
      });

      const performancePrompt = screen.getByText(
        'How can I improve the performance of my query in Compass?'
      );

      userEvent.click(performancePrompt);

      await waitFor(() => {
        expect(onMessageSendStub.calledOnce).to.be.true;
        const [message, options] = onMessageSendStub.firstCall.args;

        expect(message).to.equal(
          "How can I improve the performance of my query in Compass? Use the `explain` tool to get the query's explain output and include it in your analysis."
        );
        expect(options.metadata?.displayText).to.equal(
          'How can I improve the performance of my query in Compass?'
        );
      });
    });
  });
});
