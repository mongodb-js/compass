import type { SimpleEvalCase } from '../assistant.eval';
import atlasSearch from './atlas-search';
import aggregationPipeline from './aggregation-pipeline';
import modelData from './model-data';

export const evalCases: SimpleEvalCase[] = [
  ...atlasSearch,
  ...aggregationPipeline,
  ...modelData,
];
