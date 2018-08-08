import ipc from 'hadron-ipc';

export const TOGGLE_STATUS = 'TOGGLE_STATUS';
export const STOP_FIND = 'STOP_FIND';
export const FIND = 'FIND';

export const INITIAL_STATE = {
  enabled: true
};

function findInPage(state, action) {
  const opts = {
    forward: action.forward,
    next: action.next
  };
  ipc.call('app:find-in-page', action.searchTerm, opts);

  return state;
}

function stopFindInPage(state) {
  ipc.call('app:stop-find-in-page', 'clearSelection');

  return state;
}

export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_STATUS) {
    state.enabled = (state.enabled === true) ? false : true;
    console.log('TOGGLING STATUS', state);
    return state;
  }
  if (action.type === STOP_FIND) return stopFindInPage(state);
  if (action.type === FIND) return findInPage(state, action);

  return state;
}

export const stopFind = () => ({
  type: STOP_FIND
});

export const toggleStatus = () => ({
  type: TOGGLE_STATUS
});

export const find = (searchTerm, forward, next) => ({
  searchTerm: searchTerm,
  forward: forward,
  type: FIND,
  next: next
});
