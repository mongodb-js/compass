const clipboard = require('electron').clipboard;
const compiler = require('bson-compilers');

const PREFIX = 'exportQuery';

export const ADD_INPUT_QUERY = `${PREFIX}/ADD_INPUT`;
export const OUTPUT_LANG = `${PREFIX}/OUTPUT_LANG`;
export const QUERY_ERROR = `${PREFIX}/QUERY_ERROR`;
export const TOGLE_MODAL = `${PREFIX}/MODAL_OPEN`;
export const COPY_QUERY = `${PREFIX}/COPY_QUERY`;
export const CLEAR_COPY = `${PREFIX}/CLEAR_COPY`;
export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;

// TODO: change inputQuery to '' when working with compass
export const INITIAL_STATE = {
  copySuccess: false,
  queryError: null,
  modalOpen: false,
  returnQuery: '',
  outputLang: '',
  inputQuery: '' // { "item": "happysocks", "quantity": 1, "category": [ "clothing", "socks" ] }',
};

function copyToClipboard(state, action) {
  clipboard.writeText(action.input);

  return { ...state, copySuccess: true };
}

export const runQuery = (outputLang, input) => {
  return (dispatch, getState) => {
    const state = getState();

    try {
      const output = compiler.javascript[outputLang](input);
      state.exportQuery.returnQuery = output;
      state.exportQuery.queryError = null;
      return state;
    } catch (e) {
      return dispatch(queryError(e.message));
    }
  };
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === ADD_INPUT_QUERY) return { ...state, inputQuery: action.input };
  if (action.type === QUERY_ERROR) return { ...state, queryError: action.error };
  if (action.type === OUTPUT_LANG) return { ...state, outputLang: action.lang };
  if (action.type === TOGLE_MODAL) return { ...state, modalOpen: action.open };
  if (action.type === CLEAR_COPY) return { ...state, copySuccess: false };
  if (action.type === COPY_QUERY) return copyToClipboard(state, action);

  return state;
}

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
