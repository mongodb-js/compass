import {
  AgentTrajectoryScorer,
  ToolCallScorers,
  extractActualToolCalls,
  extractRequiredToolCalls,
} from 'mongodb-assistant-eval/scorers';
import type {
  ConversationEvalScorer,
  ConversationTaskOutput,
} from 'mongodb-assistant-eval/eval';
import type { ConversationExpectedMessages } from 'mongodb-assistant-eval/schema';

type OutputMessages = ConversationTaskOutput['messages'];

// With tools disabled, the assistant must not make a tool call, so any call
// scores 0. Without one, the answer should also tell the user how to turn tools
// on; an answer that doesn't still gets a partial score.
function scoreRedirectsToEnableTools(answer: string, calledNames: string[]) {
  const madeToolCall = calledNames.some((name) => name !== 'skill');
  const redirects = /enable/i.test(answer) && /tool/i.test(answer);
  const score = madeToolCall ? 0 : redirects ? 1 : 0.5;
  return { name: 'RedirectsToEnableTools', score };
}

// The agent model often looks up the schema before the call a case expects. That
// lookup is optional, so it is ignored unless the case expects it. A skill is
// ignored the same way, but only when the case expects no tool calls, since
// otherwise a skill sends the case to the trajectory scorer. When the case
// expects no tool calls, a schema lookup is still a tool call and is kept.
const OPTIONAL_CALLS = ['collection-schema', 'skill'];

function withoutOptionalCalls(
  messages: OutputMessages,
  expectedNames: string[]
): OutputMessages {
  const ignored = expectedNames.length
    ? OPTIONAL_CALLS.filter((name) => !expectedNames.includes(name))
    : ['skill'];
  const ignoredCallIds = new Set(
    messages.flatMap((message) =>
      message.role === 'assistant'
        ? (message.toolCalls ?? [])
            .filter(
              (call) =>
                call.type === 'function' && ignored.includes(call.function.name)
            )
            .map((call) => call.id)
        : []
    )
  );
  return messages.flatMap((message): OutputMessages => {
    if (message.role === 'tool') {
      return ignoredCallIds.has(message.toolCallId) ? [] : [message];
    }
    if (message.role !== 'assistant' || !message.toolCalls) {
      return [message];
    }
    const toolCalls = message.toolCalls.filter(
      (call) => !ignoredCallIds.has(call.id)
    );
    return toolCalls.length ? [{ ...message, toolCalls }] : [];
  });
}

// The harness reports every step as an assistant message with its calls,
// followed by a tool message per call, and the scorers compare messages by
// position. The cases only list the calls, so the matching tool messages are
// added here.
function withToolResults(
  messages: NonNullable<ConversationExpectedMessages>
): NonNullable<ConversationExpectedMessages> {
  return messages.flatMap(
    (message): NonNullable<ConversationExpectedMessages> =>
      message.role === 'assistant-tool'
        ? [message, ...message.toolCalls.map(() => ({ role: 'tool' as const }))]
        : [message]
  );
}

const scoreByPosition = (
  args: Parameters<ConversationEvalScorer>[0],
  expectedNames: string[]
) =>
  ToolCallScorers({
    ...args,
    expected: args.expected && {
      ...args.expected,
      outputMessages:
        args.expected.outputMessages &&
        withToolResults(args.expected.outputMessages),
    },
    output: {
      ...args.output,
      messages: withoutOptionalCalls(args.output.messages, expectedNames),
    },
  });

/**
 * Tool calls are scored by `ToolCallScorers` from mongodb-assistant-eval.
 *
 * Cases where a skill is involved are scored by `AgentTrajectoryScorer`
 * instead. That is the case when the case expects a skill, or when the model
 * loaded one on its own while the case expects tool calls. A skill can trigger
 * further calls and how many varies between runs, so the message-position
 * scorers don't fit. The trajectory scorer checks that the expected calls were
 * made, in any order. Extra calls are allowed, up to twice the number of
 * expected calls.
 *
 * Cases that expect no tool calls always keep the position scorers, so a tool
 * call is still caught after a skill was loaded.
 *
 * Cases run with tools disabled also check that no tool was called and that the
 * answer points the user to enabling them, which the package scorers don't
 * cover, and which the trajectory scorer can't check at all.
 */
export const CompassToolCallScorers: ConversationEvalScorer = async (args) => {
  const expectedNames = extractRequiredToolCalls({
    outputMessages: args.expected?.outputMessages,
  }).map((call) => call.name);
  const calledNames = extractActualToolCalls(args.output.messages).map(
    (call) => call.name
  );
  const involvesSkill =
    expectedNames.includes('skill') ||
    (expectedNames.length > 0 && calledNames.includes('skill'));

  const toolScores = involvesSkill
    ? await AgentTrajectoryScorer(args)
    : await scoreByPosition(args, expectedNames);

  if (!args.input.custom?.toolsDisabled) {
    return toolScores;
  }
  return [
    ...(Array.isArray(toolScores) ? toolScores : []),
    scoreRedirectsToEnableTools(
      args.output.assistantMessageContent,
      calledNames
    ),
  ];
};
