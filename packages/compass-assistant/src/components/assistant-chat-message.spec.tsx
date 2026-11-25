import React from 'react';
import { render, screen } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { AssistantMessage } from '../compass-assistant-provider';
import { AssistantChatMessage } from './assistant-chat-message';

describe('AssistantChatMessage reasoning steps', function () {
  const message = {
    id: 'm1',
    role: 'assistant',
    metadata: {},
    parts: [
      { type: 'reasoning', text: 'Calling schema-design skill' },
      { type: 'text', text: 'Here is your answer' },
    ],
  } as unknown as AssistantMessage;

  function renderMessage(isThinking: boolean, msg = message) {
    return render(
      <AssistantChatMessage
        message={msg}
        isLastMessage
        isResponseComplete={!isThinking}
        isThinking={isThinking}
        enableSearchActivationProgramP2={false}
        onFeedback={sinon.stub()}
        onConfirmation={sinon.stub()}
        onToolApproval={sinon.stub()}
        onFollowUpSend={sinon.stub()}
      />
    );
  }

  it('renders no thinking block when there are no reasoning parts', function () {
    renderMessage(false, {
      ...message,
      parts: [{ type: 'text', text: 'Plain answer' }],
    } as unknown as AssistantMessage);

    expect(screen.getByText('Plain answer')).to.exist;
    expect(screen.queryByText('Thought')).to.not.exist;
  });
});
