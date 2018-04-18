// const compiler = require('bson-compilers');

const PREFIX = 'exportQuery';

export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;
export const COPY_QUERY = `${PREFIX}/COPY_QUERY`;
export const CLEAR_COPY = `${PREFIX}/CLEAR_COPY`;

export const INITIAL_STATE = {
  compilerError: '',
  copySuccess: '',
  returnQuery: '',
  copyError: ''
};

function getClearCopy(state, action) {
  const newState = action.input === 'success'
    ? { ...state, copySuccess: '' }
    : { ...state, copyError: '' };

  return newState;
}

function copyToClipboard(state, action) {
  console.log('copying to clipboard');
  action.input.select();
  const copy = document.execCommand('copy');
  const newState = copy
    ? { ...state, copySuccess: true }
    : { ...state, copyError: true };

  return newState;
}

function getExportOutput(state, action) {
  console.log('getting to export', action.outputLang, action.input);
  // try {
  //   var output = compiler.javascript[action.outputLang](action.input)
  // } catch (e) {
  //   console.log(e)
  // }

  return { ...state, returnQuery: action.input };
}

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === RUN_QUERY) return getExportOutput(state, action);
  if (action.type === COPY_QUERY) return copyToClipboard(state, action);
  if (action.type === CLEAR_COPY) return getClearCopy(state, action);

  return state;
}

export const runQuery = (outputLang, input) => ({
  outputLang: outputLang,
  type: RUN_QUERY,
  input: input
});

export const copyQuery = (input) => ({
  type: COPY_QUERY,
  input: input
});

export const clearCopy = (copyType) => ({
  type: CLEAR_COPY,
  input: copyType
});
