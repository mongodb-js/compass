import type { SimpleEvalCase } from '../assistant.eval';
import { generatedEvalCases } from './generated-cases';
import { trickQuestions } from './trick-questions';
import { humilityEvalCases } from './humility';

export const evalCases: SimpleEvalCase[] = [
  ...generatedEvalCases,
  ...trickQuestions,
  ...humilityEvalCases,
];
