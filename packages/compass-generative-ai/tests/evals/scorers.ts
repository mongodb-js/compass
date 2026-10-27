import { Factuality as _Factuality } from 'autoevals';
import type { ConversationEvalScorer } from './types';
import { allText } from './utils';

export const Factuality: ConversationEvalScorer = ({
  input,
  output,
  expected,
}) => {
  return _Factuality({
    input: allText(input.messages),
    output: allText(output.messages),
    expected: allText(expected.messages),
    model: 'gpt-4.1',
    temperature: undefined,
  });
};
