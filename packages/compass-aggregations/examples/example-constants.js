export const INITIAL_INPUT_DOCUMENTS = {
  documents: [],
  isLoading: false,
  isExpanded: true,
  count: 0
};

export const EXAMPLE = {
  pipeline: [],
  fields: [],
  // { name: '_id', value: '_id', score: 1, meta: 'field', version: '0.0.0' },
  // { name: 'name', value: 'name', score: 1, meta: 'field', version: '0.0.0'}
  inputDocuments: {
    ...INITIAL_INPUT_DOCUMENTS
  },
  savedPipeline: {
    isNameValid: true,
    pipelines: [],
    isListVisible: false,
    isModalVisible: false,
    isModalError: false
  }
};

export const STAGE_DEFAULTS = {
  previewDocuments: [],
  isExpanded: true,
  error: null,
  syntaxError: '',
  isValid: true,
  isEnabled: true,
  isLoading: false,
  isComplete: true
};