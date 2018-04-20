const compiler = require('bson-compilers');

const PREFIX = 'exportQuery';

export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;
export const COPY_QUERY = `${PREFIX}/COPY_QUERY`;
export const CLEAR_COPY = `${PREFIX}/CLEAR_COPY`;
export const QUERY_ERROR = `${PREFIX}/QUERY_ERROR`;

export const INITIAL_STATE = {
  copySuccess: '',
  returnQuery: '',
  queryError: null,
  copyError: null
};

function getClearCopy(state, action) {
  const newState = action.input === 'success'
    ? { ...state, copySuccess: '' }
    : { ...state, copyError: '' };

  return newState;
}

function copyToClipboard(state, action) {
  action.input.select();
  const copy = document.execCommand('copy');
  const newState = copy
    ? { ...state, copySuccess: true }
    : { ...state, copyError: true };

  return newState;
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
  if (action.type === QUERY_ERROR) return { ...state, queryError: action.error };
  if (action.type === COPY_QUERY) return copyToClipboard(state, action);
  if (action.type === CLEAR_COPY) return getClearCopy(state, action);

  return state;
}

export const copyQuery = (input) => ({
  type: COPY_QUERY,
  input: input
});

export const queryError = (error) => ({
  type: QUERY_ERROR,
  error: error
});

export const clearCopy = (copyType) => ({
  type: CLEAR_COPY,
  input: copyType
});
