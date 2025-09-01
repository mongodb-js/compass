import type { SimpleEvalCase } from '../assistant.eval';
import filterDocsBeforeSearch from './atlas-search';
import aggregationPipeline from './aggregation';
import modelData from './model-data';
import explainPlan from './explain-plan';
import connectionError from './connection-error';

export const evalCases: SimpleEvalCase[] = [
  filterDocsBeforeSearch,
  aggregationPipeline,
  modelData,
  explainPlan,
  connectionError,
].flat();
