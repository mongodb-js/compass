import type { SimpleEvalCase } from '../assistant.eval';
import { modelDataEvalCases } from './model-data';
import { atlasSearchEvalCases } from './atlas-search';
import { aggregationPipelineEvalCases } from './aggregation-pipeline';
import { generatedEvalCases } from './generated-cases';

export const evalCases: SimpleEvalCase[] = [
  ...atlasSearchEvalCases,
  ...generatedEvalCases,
  ...aggregationPipelineEvalCases,
  ...modelDataEvalCases,
];
