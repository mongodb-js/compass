const stringify = require('javascript-stringify');
const clipboard = require('electron').clipboard;
const compiler = require('bson-compilers');

const PREFIX = 'exportQuery';

export const SET_NAMESPACE = `${PREFIX}/SET_NAMESPACE`;
export const ADD_INPUT_QUERY = `${PREFIX}/ADD_INPUT`;
export const INCLUDE_IMPORTS = `${PREFIX}/IMPORTS`;
export const OUTPUT_LANG = `${PREFIX}/OUTPUT_LANG`;
export const QUERY_ERROR = `${PREFIX}/QUERY_ERROR`;
export const TOGLE_MODAL = `${PREFIX}/MODAL_OPEN`;
export const COPY_QUERY = `${PREFIX}/COPY_QUERY`;
export const CLEAR_COPY = `${PREFIX}/CLEAR_COPY`;
export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;

// TODO: change inputQuery to '' when working with compass
export const INITIAL_STATE = {
  namespace: 'Query',
  outputLang: 'java',
  copySuccess: false,
  queryError: null,
  modalOpen: false,
  returnQuery: '',
  imports: false,
  inputQuery: '' // { category_code: "web", twitter_username: null }
};

function copyToClipboard(state, action) {
  clipboard.writeText(action.input);

  return { ...state, copySuccess: true };
}

function closeModal(state, action) {
  if (!action.open) return INITIAL_STATE;

  return { ...state, modalOpen: action.open };
}

export const runQuery = (outputLang, input) => {
  return (dispatch, getState) => {
    const state = getState();

    try {
      const output = compiler.shell[outputLang](stringify(input));
      const imports = state.exportQuery.imports ? compiler.imports[outputLang] : '';
      state.exportQuery.returnQuery = imports + '\n' + output;
      state.exportQuery.queryError = null;
      return state;
    } catch (e) {
      return dispatch(queryError(e.message));
    }
  };
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_NAMESPACE) return { ...state, namespace: action.namespace };
  if (action.type === ADD_INPUT_QUERY) return { ...state, inputQuery: action.input };
  if (action.type === INCLUDE_IMPORTS) return { ...state, imports: action.imports };
  if (action.type === QUERY_ERROR) return { ...state, queryError: action.error };
  if (action.type === OUTPUT_LANG) return { ...state, outputLang: action.lang };
  if (action.type === CLEAR_COPY) return { ...state, copySuccess: false };
  if (action.type === COPY_QUERY) return copyToClipboard(state, action);
  if (action.type === TOGLE_MODAL) return closeModal(state, action);

  return state;
}

export const setNamespace = (namespace) => ({
  type: SET_NAMESPACE,
  namespace: namespace
});

export const includeImports = (imports) => ({
  type: INCLUDE_IMPORTS,
  imports: imports
});

export const setOutputLang = (lang) => ({
  type: OUTPUT_LANG,
  lang: lang
});

export const addInputQuery = (input) => ({
  type: ADD_INPUT_QUERY,
  input: input
});

export const queryError = (error) => ({
  type: QUERY_ERROR,
  error: error
});

export const copyQuery = (input) => ({
  type: COPY_QUERY,
  input: input
});

export const togleModal = (open) => ({
  type: TOGLE_MODAL,
  open: open
});

export const clearCopy = () => ({
  type: CLEAR_COPY
});
