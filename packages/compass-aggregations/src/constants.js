/**
 * An initial stage. See modules/pipeline.js
 */
export const EMPTY_STAGE = {
  stageOperator: null,
  stage: '',
  isValid: true,
  isEnabled: true,
  isExpanded: true,
  isLoading: false,
  isComplete: false,
  previewDocuments: [],
  syntaxError: null,
  error: null
};
