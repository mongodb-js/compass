import { Chat } from '../src/@ai-sdk/react/chat-react';
import sinon from 'sinon';
import type { AssistantMessage } from '../src/compass-assistant-provider';

export const createMockChat = ({
  messages,
  status,
  transport,
}: {
  messages: AssistantMessage[];
  status?: Chat<AssistantMessage>['status'];
  transport?: Chat<AssistantMessage>['transport'];
}) => {
  const newChat = new Chat<AssistantMessage>({
    messages,
    transport,
  });
  sinon.replace(newChat, 'sendMessage', sinon.stub());
  if (status) {
    sinon.replaceGetter(newChat, 'status', () => status);
  }
  return newChat as unknown as Chat<AssistantMessage> & {
    sendMessage: sinon.SinonStub;
  };
};

export function createBrokenTransport() {
  const testError = new Error('Test connection error');
  testError.name = 'ConnectionError';
  const transport = {
    sendMessages: sinon.stub().rejects(testError),
    reconnectToStream: sinon.stub().resolves(null),
  };
  return transport;
}

export function createBrokenChat() {
  const chat = new Chat<AssistantMessage>({
    messages: [],
    transport: createBrokenTransport(),
  });
  return chat;
}

type MockTool = {
  name: string;
  description: string;
  parameters: {
    type: 'object';
    properties: Record<string, unknown>;
  };
  execute: (params: { abortSignal: AbortSignal }) => Promise<unknown>;
};

type ToolTracking<T = string> = {
  abortSignal: AbortSignal | null;
  wasAborted: boolean;
  result: T | undefined;
};

/**
 * Creates a slow-running tool for testing abort functionality.
 * Returns both the tool definition and tracking objects to monitor abort state.
 */
export function createSlowTool(delayMs = 10_000): {
  tool: MockTool;
  tracking: ToolTracking;
} {
  const tracking: ToolTracking = {
    abortSignal: null,
    wasAborted: false,
    result: undefined,
  };

  const tool: MockTool = {
    name: 'slow-tool',
    description: 'A slow tool for testing abort functionality',
    parameters: {
      type: 'object' as const,
      properties: {},
    },
    execute: async ({ abortSignal }: { abortSignal: AbortSignal }) => {
      tracking.abortSignal = abortSignal;

      // Listen for abort events
      abortSignal.addEventListener('abort', () => {
        tracking.wasAborted = true;
      });

      // Simulate a slow operation
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(resolve, delayMs);

        abortSignal.addEventListener('abort', () => {
          clearTimeout(timeout);
          reject(new Error('Tool execution was cancelled'));
        });
      });

      tracking.result = 'This should not be reached';
      return { result: tracking.result };
    },
  };

  return { tool, tracking };
}

/**
 * Creates a mock transport that executes tools with abort signal support.
 * This allows testing of tool cancellation behavior.
 */
export function createMockToolsTransport(tools: MockTool[]) {
  const toolsMap = new Map(tools.map((tool) => [tool.name, tool]));

  const transport = {
    sendMessages: sinon
      .stub()
      .callsFake(({ abortSignal }: { abortSignal: AbortSignal }) => {
        return new ReadableStream({
          start(controller) {
            let isClosed = false;

            // Helper to safely enqueue
            const safeEnqueue = (chunk: unknown) => {
              if (!isClosed) {
                controller.enqueue(chunk);
              }
            };

            // Emit tool call parts for each tool
            for (const tool of tools) {
              safeEnqueue({
                type: 'delta',
                parts: [
                  {
                    type: 'tool-input-available',
                    toolCallId: `${tool.name}-call-id`,
                    toolName: tool.name,
                    input: {},
                    state: 'approval-responded',
                    approval: {
                      id: `${tool.name}-approval-id`,
                      approved: true,
                    },
                  },
                ],
              });

              // Execute the tool in the background with abort signal
              const toolToExecute = toolsMap.get(tool.name);
              if (toolToExecute) {
                void toolToExecute
                  .execute({ abortSignal })
                  .catch((error: Error) => {
                    // Tool was aborted or errored - enqueue error message if stream is still open
                    safeEnqueue({
                      type: 'delta',
                      parts: [
                        {
                          type: 'tool-output-error',
                          toolCallId: `${tool.name}-call-id`,
                          toolName: tool.name,
                          state: 'output-error',
                          errorText: error.message,
                        },
                      ],
                    });
                  });
              }
            }

            // Keep stream open until aborted
            abortSignal.addEventListener('abort', () => {
              isClosed = true;
              controller.close();
            });
          },
        });
      }),
    reconnectToStream: sinon.stub().resolves(null),
  };

  return transport;
}
