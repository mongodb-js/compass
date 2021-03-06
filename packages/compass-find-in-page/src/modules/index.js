// export const CURRENT_RESULT = 'CURRENT_RESULT';
export const TOGGLE_STATUS = 'TOGGLE_STATUS';
// export const TOTAL_RESULTS = 'TOTAL_RESULTS';
export const SEARCH_TERM = 'SEARCH_TERM';
export const STOP_FIND = 'STOP_FIND';
export const FIND = 'FIND';

export const INITIAL_STATE = {
  // currentResult: null,
  // totalResults: null,
  searching: false,
  searchTerm: '',
  enabled: false
};

function find(state, action) {
  const ipc = require('hadron-ipc');
  const opts = {
    forward: action.forward,
    findNext: action.findNext
  };

  ipc.call('app:find-in-page', action.val, opts);

  return { ...state, searching: true };
}

function stopFind(state) {
  const ipc = require('hadron-ipc');
  ipc.call('app:stop-find-in-page', 'clearSelection');

  return { ...state, searching: false };
}

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_STATUS) return { ...state, enabled: state.enabled === true ? false : true };
  // if (action.type === CURRENT_RESULT) return { ...state, currentResult: action.currentResult };
  // if (action.type === TOTAL_RESULTS) return { ...state, totalResults: action.totalResults };
  if (action.type === SEARCH_TERM) return { ...state, searchTerm: action.searchTerm };
  if (action.type === STOP_FIND) return stopFind(state);
  if (action.type === FIND) return find(state, action);

  return state;
}

export const dispatchFind = (val, forward, findNext) => ({
  findNext: findNext,
  forward: forward,
  type: FIND,
  val: val
});

// TODO: set UI for search results coming in from Electron's WebContents'
// found-in-page results.
//
// export const setCurrentResult = (currentResult) => ({
//   currentResult: currentResult,
//   type: CURRENT_RESULT
// });
//
// export const setTotalResults = (totalResults) => ({
//   totalResults: totalResults,
//   type: TOTAL_RESULTS
// });

export const setSearchTerm = (searchTerm) => ({
  searchTerm: searchTerm,
  type: SEARCH_TERM
});

export const dispatchStopFind = () => ({
  type: STOP_FIND
});

export const toggleStatus = () => ({
  type: TOGGLE_STATUS
});
