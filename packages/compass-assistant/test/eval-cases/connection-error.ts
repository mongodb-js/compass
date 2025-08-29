import type { SimpleEvalCase } from '../assistant.eval';

export const connectionErrorTag = 'connection-error';

// TODO: Julian/whoever fills this in
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
  tags: [connectionErrorTag],
  systemPromptType: 'connection-error',
}));

export default evalCases;
