import type { SimpleEvalCase } from '../assistant.eval';

export const explainPlanTag = 'explain-plan';

// TODO: Julian fills this in
const evalCases: SimpleEvalCase[] = [
  {
    input: 'TODO:...',

    expected: 'TODO:...',
    expectedSources: [
      // TODO: add sources
    ],
  },
].map((c) => ({
  ...c,
  tags: [explainPlanTag],
  systemPromptType: 'explain-plan',
}));

export default evalCases;
