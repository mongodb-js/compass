import * as explainPlan from './explain-plan';

export function makeEntrypointCases() {
  return [
    {
      name: 'Explain plan',
      input: {
        messages: [{ text: explainPlan.buildPrompt() }],
      },
      expected: {
        messages: [
          {
            text: explainPlan.buildExpected(),
            sources: explainPlan.buildExpectedSources(),
          },
        ],
      },
      metadata: {},
    },
  ];
}
