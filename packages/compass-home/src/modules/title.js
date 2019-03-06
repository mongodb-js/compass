const electron = require('electron').remote;
const electronApp = electron ? electron.app : {getName: 'not run within electron'};
/**
 * Title action.
 */
export const CHANGE_TITLE = 'home/title/CHANGE_TITLE';

/**
 * The initial state of the title.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to title.
 *
 * @param {String} state - The title state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_TITLE) {
    return action.title;
  }
  return state;
}

/**
 * The change title action creator.
 *
 * @param {String} title - The title.
 *
 * @returns {Object} The action.
 */
export const changeTitle = (title) => ({
  type: CHANGE_TITLE,
  title: title
});

export const updateTitle = (namespace) => {
  return (dispatch, getState) => {
    const state = getState();
    let title = `${electronApp.getName()} - ${state.instanceId}`;
    if (namespace) {
      title += '/' + namespace;
    }
    document.title = title;
    dispatch(changeTitle(title)); // TODO
  };
};

