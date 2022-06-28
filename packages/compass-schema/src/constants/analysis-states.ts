export const ANALYSIS_STATE_INITIAL = 'initial';
export const ANALYSIS_STATE_ANALYZING = 'analyzing';
export const ANALYSIS_STATE_ERROR = 'error';
export const ANALYSIS_STATE_COMPLETE = 'complete';
export const ANALYSIS_STATE_TIMEOUT = 'timeout';

export type AnalysisState =
  | typeof ANALYSIS_STATE_INITIAL
  | typeof ANALYSIS_STATE_ANALYZING
  | typeof ANALYSIS_STATE_ERROR
  | typeof ANALYSIS_STATE_COMPLETE
  | typeof ANALYSIS_STATE_TIMEOUT;
