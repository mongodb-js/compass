import type { SimpleEvalCase } from '../assistant.eval';
import aggregationPipelineCases from './aggregation-pipeline';
import connectionErrorCases from './connection-errors';
import oidcAuthCases from './oidc-auth';
import explainPlanCases from './explain-plan';
import atlasSearchCases from './atlas-search';
import dataModelingCases from './data-modeling';
export const evalCases: SimpleEvalCase[] = [
  ...aggregationPipelineCases,
  ...connectionErrorCases,
  ...oidcAuthCases,
  ...explainPlanCases,
  ...atlasSearchCases,
  ...dataModelingCases,
];
