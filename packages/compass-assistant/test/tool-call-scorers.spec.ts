import { expect } from 'chai';
import type { ConversationTaskOutput } from 'mongodb-assistant-eval/eval';
import { CompassToolCallScorers } from './tool-call-scorers';

function call(name: string) {
  return {
    role: 'assistant' as const,
    content: '',
    toolCalls: [
      {
        id: `${name}-id`,
        type: 'function' as const,
        function: { name, arguments: '{}' },
      },
    ],
  };
}

async function score(
  expectedMessages: (
    | { role: 'assistant-tool'; toolCalls: { name: string }[] }
    | { role: 'assistant' }
  )[],
  outputCalls: ReturnType<typeof call>[],
  { text = '', toolsDisabled = false } = {}
) {
  const output: ConversationTaskOutput = {
    messages: outputCalls,
    assistantMessageContent: text,
    allowedQuery: true,
  };
  const scores = (await CompassToolCallScorers({
    input: { messages: [], custom: { toolsDisabled } },
    output,
    expected: { outputMessages: expectedMessages },
  })) as { name: string; score: number | null }[];
  return Object.fromEntries(scores.map((s) => [s.name, s.score]));
}

const expectCount = [
  { role: 'assistant-tool' as const, toolCalls: [{ name: 'count' }] },
];

describe('CompassToolCallScorers', function () {
  it('scores tool calls with the package scorers', async function () {
    const scores = await score(expectCount, [call('count')]);
    expect(scores).to.have.property('ToolCallAmountCorrect', 1);
    expect(scores).to.not.have.property('RedirectsToEnableTools');

    const extra = await score(expectCount, [call('count'), call('find')]);
    expect(extra.ToolCallAmountCorrect).to.be.lessThan(1);
  });

  describe('with tools disabled', function () {
    const toolsDisabled = true;
    const noTool = [{ role: 'assistant' as const }];

    it('passes when no tool is called and the user is told to enable tools', async function () {
      const scores = await score(noTool, [], {
        toolsDisabled,
        text: 'Enable read-only tool access and I can check.',
      });
      expect(scores).to.include({
        ToolCallAmountCorrect: 1,
        RedirectsToEnableTools: 1,
      });
    });

    it('fails when a tool is called or the answer does not mention enabling tools', async function () {
      const scores = await score(noTool, [call('list-databases')], {
        toolsDisabled,
        text: 'Here are your databases.',
      });
      expect(scores).to.include({
        ToolCallAmountCorrect: 0,
        RedirectsToEnableTools: 0,
      });
    });

    it('gives half the score when no tool is called but the answer does not mention enabling tools', async function () {
      const scores = await score(noTool, [], {
        toolsDisabled,
        text: 'The default indexes on this collection are _id and a text index.',
      });
      expect(scores).to.include({
        ToolCallAmountCorrect: 1,
        RedirectsToEnableTools: 0.5,
      });
    });

    it('scores 0 when a tool was called, even if the answer mentions enabling tools', async function () {
      const scores = await score(noTool, [call('list-databases')], {
        toolsDisabled,
        text: 'Enable read-only tool access to see more.',
      });
      expect(scores).to.include({ RedirectsToEnableTools: 0 });
    });

    it('does not count a loaded skill as a tool call', async function () {
      const redirected = await score(noTool, [call('skill')], {
        toolsDisabled,
        text: 'Enable read-only tool access and I can check the indexes.',
      });
      expect(redirected).to.include({ RedirectsToEnableTools: 1 });

      const notRedirected = await score(noTool, [call('skill')], {
        toolsDisabled,
        text: 'The default indexes are _id and a text index.',
      });
      expect(notRedirected).to.include({ RedirectsToEnableTools: 0.5 });
    });
  });

  describe('schema lookups', function () {
    const expectFind = [
      { role: 'assistant-tool' as const, toolCalls: [{ name: 'find' }] },
    ];

    it('ignores a schema lookup the case does not expect', async function () {
      const scores = await score(expectFind, [
        call('collection-schema'),
        call('find'),
      ]);
      expect(scores).to.include({
        ToolCallAmountCorrect: 1,
        ToolOrderCorrect: 1,
      });
    });

    it('still penalizes a missing expected call after a schema lookup', async function () {
      const scores = await score(expectFind, [call('collection-schema')]);
      expect(scores.ToolCallAmountCorrect).to.equal(0);
    });

    it('counts the schema lookup when the case expects it', async function () {
      const expectSchemaThenFind = [
        {
          role: 'assistant-tool' as const,
          toolCalls: [{ name: 'collection-schema' }],
        },
        ...expectFind,
      ];
      const scores = await score(expectSchemaThenFind, [call('find')]);
      expect(scores.ToolCallAmountCorrect).to.equal(0.5);
    });
  });

  describe('when the model loads a skill the case does not expect', function () {
    const expectFind = [
      { role: 'assistant-tool' as const, toolCalls: [{ name: 'find' }] },
    ];
    const noTool = [{ role: 'assistant' as const }];

    it('scores a case that expects tool calls by trajectory', async function () {
      const scores = await score(expectFind, [call('skill'), call('find')]);
      expect(scores).to.include({ ToolCallCoverage: 1 });
      expect(scores).to.not.have.property('ToolCallAmountCorrect');
    });

    it('still penalizes a missing expected call', async function () {
      const scores = await score(expectFind, [call('skill')]);
      expect(scores).to.include({ ToolCallCoverage: 0 });
    });

    it('ignores the skill when the case expects no tool calls', async function () {
      const scores = await score(noTool, [call('skill')]);
      expect(scores).to.include({ ToolCallAmountCorrect: 1 });
    });

    it('still catches a tool call after the skill when the case expects none', async function () {
      const scores = await score(noTool, [
        call('skill'),
        call('list-databases'),
      ]);
      expect(scores).to.include({ ToolCallAmountCorrect: 0 });
    });
  });

  describe('cases that expect a skill', function () {
    const expected = (...names: string[]) =>
      names.map((name) => ({
        role: 'assistant-tool' as const,
        toolCalls: [{ name }],
      }));

    it('scores the skill call by coverage and allows extra calls up to twice the expected count', async function () {
      const withinCeiling = await score(expected('skill'), [
        call('collection-schema'),
        call('skill'),
      ]);
      expect(withinCeiling).to.include({ ToolCallCoverage: 1 });
      expect(withinCeiling).to.not.have.property('ToolCallAmountCorrect');

      const runaway = await score(expected('skill'), [
        call('collection-schema'),
        call('skill'),
        call('collection-indexes'),
      ]);
      expect(runaway.ToolCallCoverage).to.be.closeTo(2 / 3, 1e-9);
    });

    it('penalizes a skill that was not loaded', async function () {
      const scores = await score(expected('skill'), [
        call('collection-indexes'),
      ]);
      expect(scores).to.include({ ToolCallCoverage: 0 });
    });

    it('also checks that tools are not called when they are disabled', async function () {
      const scores = await score(expected('skill'), [call('skill')], {
        toolsDisabled: true,
        text: 'Enable read-only tool access to let me run the checks.',
      });
      expect(scores).to.include({
        ToolCallCoverage: 1,
        RedirectsToEnableTools: 1,
      });
    });
  });

  describe('calls over several steps', function () {
    // One assistant message per step, followed by a tool message per call.
    const step = (...names: string[]) => [
      {
        role: 'assistant' as const,
        content: '',
        toolCalls: names.map((name) => ({
          id: `${name}-id`,
          type: 'function' as const,
          function: { name, arguments: '{}' },
        })),
      },
      ...names.map((name) => ({
        role: 'tool' as const,
        toolCallId: `${name}-id`,
        name,
        content: '{}',
      })),
    ];
    const expectSequence = ['get-current-query', 'explain'].map((name) => ({
      role: 'assistant-tool' as const,
      toolCalls: [{ name }],
    }));

    async function scoreMessages(messages: ConversationTaskOutput['messages']) {
      const scores = (await CompassToolCallScorers({
        input: { messages: [], custom: { toolsDisabled: false } },
        output: {
          messages,
          assistantMessageContent: '',
          allowedQuery: true,
        },
        expected: { outputMessages: expectSequence },
      })) as { name: string; score: number | null }[];
      return Object.fromEntries(scores.map((s) => [s.name, s.score]));
    }

    it('scores calls made in separate steps as in order', async function () {
      const scores = await scoreMessages([
        ...step('get-current-query'),
        ...step('explain'),
      ]);
      expect(scores).to.include({
        ToolCallAmountCorrect: 1,
        ToolOrderCorrect: 1,
      });
    });

    it('keeps the order when an ignored schema lookup sits between steps', async function () {
      const scores = await scoreMessages([
        ...step('get-current-query'),
        ...step('collection-schema'),
        ...step('explain'),
      ]);
      expect(scores).to.include({
        ToolCallAmountCorrect: 1,
        ToolOrderCorrect: 1,
      });
    });
  });
});
