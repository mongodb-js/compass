import type { SimpleEvalCase } from '../assistant.eval';
import filterDocsBeforeSearch from './filter-docs-before-search';
import aggregationPipeline from './aggregation-pipeline';
import modelData from './model-data';

export const evalCases: SimpleEvalCase[] = [
  filterDocsBeforeSearch,
  aggregationPipeline,
  modelData,
];
