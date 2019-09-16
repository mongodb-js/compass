import {
  globalAppRegistryEmit
} from 'mongodb-redux-common/app-registry';
import compiler from 'bson-transpilers';

const PREFIX = 'exportQuery';

export const SET_NAMESPACE = `${PREFIX}/SET_NAMESPACE`;
export const ADD_INPUT_QUERY = `${PREFIX}/ADD_INPUT`;
export const INCLUDE_IMPORTS = `${PREFIX}/IMPORTS`;
export const USE_BUILDERS = `${PREFIX}/USE_BUILDERS`;
export const OUTPUT_LANG = `${PREFIX}/OUTPUT_LANG`;
export const QUERY_ERROR = `${PREFIX}/QUERY_ERROR`;
export const TOGGLE_MODAL = `${PREFIX}/MODAL_OPEN`;
export const COPY_QUERY = `${PREFIX}/COPY_QUERY`;
export const CLEAR_COPY = `${PREFIX}/CLEAR_COPY`;
export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;
export const COPY_TO_CLIPBOARD_FN_CHANGED = `${PREFIX}/COPY_TO_CLIPBOARD_FN_CHANGED`;

// TODO: change inputQuery to '' when working with compass
export const INITIAL_STATE = {
  namespace: 'Query',
  outputLang: 'python',
  copySuccess: false,
  queryError: null,
  modalOpen: false,
  returnQuery: '',
  inputQuery: '',
  imports: '',
  showImports: false,
  builders: true,
  copyToClipboardFn: null
};

function copyToClipboard(state, action) {
  if (state.copyToClipboardFn) {
    state.copyToClipboardFn(action.input.query);
  } else {
    const { clipboard } = require('electron');
    clipboard.writeText(action.input.query);
  }
  return { ...state, copySuccess: action.input.type };
}

function closeModal(state, action) {
  if (!action.open) return INITIAL_STATE;

  return { ...state, modalOpen: action.open };
}

function addImports(state, action) {
  if (action.imports) {
    return { ...state, showImports: true};
  }

  return { ...state, showImports: false};
}

export const runQuery = (outputLang, input) => {
  return (dispatch, getState) => {
    const state = getState();

    try {
      const output = compiler.shell[outputLang].compile(input, state.exportQuery.builders);
      state.exportQuery.imports = compiler.shell[outputLang].getImports();
      state.exportQuery.returnQuery = output;
      state.exportQuery.queryError = null;
      dispatch(
        globalAppRegistryEmit(
          'compass:export-to-language:run',
          { language: state.outputLang, showImports: state.showImports, type: state.namespace }
        )
      );
      return state;
    } catch (e) {
      return dispatch(queryError(e.message));
    }
  };
};

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_NAMESPACE) return { ...state, namespace: action.namespace };
  if (action.type === ADD_INPUT_QUERY) return { ...state, inputQuery: action.input };
  if (action.type === QUERY_ERROR) return { ...state, queryError: action.error };
  if (action.type === OUTPUT_LANG) return { ...state, outputLang: action.lang };
  if (action.type === CLEAR_COPY) return { ...state, copySuccess: false };
  if (action.type === INCLUDE_IMPORTS) return addImports(state, action);
  if (action.type === USE_BUILDERS) return { ...state, builders: action.builders };
  if (action.type === COPY_QUERY) return copyToClipboard(state, action);
  if (action.type === TOGGLE_MODAL) return closeModal(state, action);
  if (action.type === COPY_TO_CLIPBOARD_FN_CHANGED) {
    return { ...state, copyToClipboardFn: action.copyToClipboardFn };
  }
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

export const useBuilders = (builders) => ({
  type: USE_BUILDERS,
  builders: builders
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

export const toggleModal = (open) => ({
  type: TOGGLE_MODAL,
  open: open
});

export const clearCopy = () => ({
  type: CLEAR_COPY
});

/**
 * Action creator for copy to clipboard fn changed events.
 *
 * @param {Function} fn - The copy to clipboard fn.
 *
 * @returns {Object} The copy to clipboard fn changed action.
 */
export const copyToClipboardFnChanged = (fn) => ({
  type: COPY_TO_CLIPBOARD_FN_CHANGED,
  copyToClipboardFn: fn
});
