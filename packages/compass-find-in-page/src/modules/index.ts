import { ipcRenderer } from 'hadron-ipc';

export const TOGGLE_STATUS = 'TOGGLE_STATUS';
export const SEARCH_TERM = 'SEARCH_TERM';
export const STOP_FIND = 'STOP_FIND';
export const FIND = 'FIND';

export type State = {
  searching: boolean;
  searchTerm: string;
  enabled: boolean;
};
export const INITIAL_STATE: State = {
  searching: false,
  searchTerm: '',
  enabled: false,
};

type FindAction = {
  type: 'FIND';
  findNext: boolean;
  forward: boolean;
  searchTerm: string;
};
type SetSearchTermAction = {
  searchTerm: string;
  type: 'SEARCH_TERM';
};
type StopFindAction = {
  type: 'STOP_FIND';
};
type ToggleStatusAction = {
  type: 'TOGGLE_STATUS';
};
type FindInPageActions =
  | SetSearchTermAction
  | StopFindAction
  | ToggleStatusAction
  | FindAction;

function find(state: State, action: FindAction): State {
  const opts = {
    forward: action.forward,
    findNext: action.findNext,
  };

  void ipcRenderer?.call('app:find-in-page', action.searchTerm, opts);

  return { ...state, searching: true };
}

function stopFind(state: State): State {
  void ipcRenderer?.call('app:stop-find-in-page', 'clearSelection');

  return { ...state, searching: false };
}

export default function reducer(
  state = INITIAL_STATE,
  action: FindInPageActions
): State {
  if (action.type === TOGGLE_STATUS)
    return { ...state, enabled: state.enabled === true ? false : true };
  if (action.type === SEARCH_TERM)
    return { ...state, searchTerm: action.searchTerm };
  if (action.type === STOP_FIND) return stopFind(state);
  if (action.type === FIND) return find(state, action);

  return state;
}

export const dispatchFind = (
  searchTerm: string,
  isForwardSearch: boolean,
  findNext: boolean
): FindAction => ({
  findNext,
  forward: isForwardSearch,
  type: FIND,
  searchTerm,
});

export const setSearchTerm = (searchTerm: string): SetSearchTermAction => ({
  searchTerm: searchTerm,
  type: SEARCH_TERM,
});

export const dispatchStopFind = (): StopFindAction => ({
  type: STOP_FIND,
});

export const toggleStatus = (): ToggleStatusAction => ({
  type: TOGGLE_STATUS,
});
