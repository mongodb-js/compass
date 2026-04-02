import { expect } from 'chai';
import { isAssistantThinking, getToolState, partIsToolUI } from './utils';
import type { AssistantMessage } from './compass-assistant-provider';
import type {
  ChatStatus,
  ToolUIPart,
  UIMessagePart,
  UIDataTypes,
  UITools,
} from 'ai';

describe('utils', function () {
  describe('partIsToolUI', function () {
    it('should return true for tool-call parts', function () {
      const part = {
        type: 'tool-call',
        toolCallId: '123',
      } as unknown as UIMessagePart<UIDataTypes, UITools>;
      expect(partIsToolUI(part)).to.be.true;
    });

    it('should return true for parts with toolCallId', function () {
      const part = {
        type: 'custom',
        toolCallId: '123',
      } as unknown as UIMessagePart<UIDataTypes, UITools>;
      expect(partIsToolUI(part)).to.be.true;
    });

    it('should return false for text parts', function () {
      const part = { type: 'text', text: 'Hello' } as unknown as UIMessagePart<
        UIDataTypes,
        UITools
      >;
      expect(partIsToolUI(part)).to.be.false;
    });

    it('should return false for step-start parts', function () {
      const part = { type: 'step-start' } as unknown as UIMessagePart<
        UIDataTypes,
        UITools
      >;
      expect(partIsToolUI(part)).to.be.false;
    });
  });

  describe('getToolState', function () {
    it('should return "idle" for approval-requested', function () {
      expect(getToolState('approval-requested')).to.equal('idle');
    });

    it('should return "running" for approval-responded', function () {
      expect(getToolState('approval-responded')).to.equal('running');
    });

    it('should return "running" for input-available', function () {
      expect(getToolState('input-available')).to.equal('running');
    });

    it('should return "success" for output-available', function () {
      expect(getToolState('output-available')).to.equal('success');
    });

    it('should return "error" for output-error', function () {
      expect(getToolState('output-error')).to.equal('error');
    });

    it('should return "canceled" for output-denied', function () {
      expect(getToolState('output-denied')).to.equal('canceled');
    });

    it('should return "idle" for undefined', function () {
      expect(getToolState(undefined)).to.equal('idle');
    });
  });

  describe('isAssistantThinking', function () {
    describe('when status is "submitted"', function () {
      it('should return true', function () {
        const status: ChatStatus = 'submitted';
        const messages: AssistantMessage[] = [];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true even with existing messages', function () {
        const status: ChatStatus = 'submitted';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });
    });

    describe('when tools are running', function () {
      it('should return true when a tool is in approval-responded state', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'approval-responded',
                input: {},
                approval: { id: 'a1', approved: true },
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when a tool is in input-available state', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'input-available',
                input: {},
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return false when tool is completed', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'output-available',
                input: {},
                output: {},
              } as unknown as ToolUIPart,
              { type: 'text', text: 'Here are the results' },
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });
    });

    describe('when status is "streaming"', function () {
      it('should return true when there are no messages yet', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when last message is from user', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'user',
            parts: [{ type: 'text', text: 'Hello' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when assistant message has no parts', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when last part is step-start', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'step-start' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when last part is a tool UI part', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'output-available',
                input: {},
                output: {},
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when last part is empty text', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: '' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when last part is whitespace-only text', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: '   \n  ' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return false when last part has meaningful text', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Hello, how can I help?' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });

      it('should return false when text part has content after other parts', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              { type: 'step-start' },
              { type: 'text', text: 'Processing...' },
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });
    });

    describe('when status is "ready" or other states', function () {
      it('should return false when status is ready', function () {
        const status: ChatStatus = 'ready';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Done!' }],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });

      it('should return false when status is error', function () {
        const status: ChatStatus = 'error';
        const messages: AssistantMessage[] = [];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });

      it('should return true when status is ready but a tool is still running', function () {
        const status: ChatStatus = 'ready';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'approval-responded',
                input: {},
                approval: { id: 'a1', approved: true },
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });

      it('should return true when status is error but a tool is still running', function () {
        const status: ChatStatus = 'error';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '456',
                state: 'input-available',
                input: {},
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });
    });

    describe('complex scenarios', function () {
      it('should return false for completed response with multiple parts', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'user',
            parts: [{ type: 'text', text: 'Show me the data' }],
          },
          {
            id: '2',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '123',
                state: 'output-available',
                input: {},
                output: {},
              } as unknown as ToolUIPart,
              { type: 'step-start' },
              { type: 'text', text: 'Based on the data, here are my findings' },
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.false;
      });

      it('should return true when tool is still running even with previous text', function () {
        const status: ChatStatus = 'streaming';
        const messages: AssistantMessage[] = [
          {
            id: '1',
            role: 'assistant',
            parts: [{ type: 'text', text: 'Let me check that for you' }],
          },
          {
            id: '2',
            role: 'assistant',
            parts: [
              {
                type: 'tool-call',
                toolCallId: '456',
                state: 'approval-responded',
                input: {},
                approval: { id: 'a2', approved: true },
              } as unknown as ToolUIPart,
            ],
          },
        ];
        expect(isAssistantThinking(status, messages)).to.be.true;
      });
    });
  });
});
