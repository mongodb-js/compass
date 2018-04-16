const PREFIX = 'exportQuery';

export const RUN_QUERY = `${PREFIX}/RUN_QUERY`;

export const INITIAL_STATE = {
  returnQuery: ''
};

export default function reducer (state = INITIAL_STATE, action) {
  if (action.type === RUN_QUERY) return getExportOutput(state, action);
  return state;
};

export const runQuery = (outputLang, input) => ({
  outputLang: outputLang,
  type: RUN_QUERY,
  input: input
});

export const copyToClipboard = (input) => ({
})

function getExportOutput(state, action) {
  console.log('getting to export', action.outputLang, action.input);
  return {...state, returnQuery: action.input};
};
