/**
 * Is atlas deployed action.
 */
export const SET_IS_ATLAS_DEPLOYED = 'aggregations/is-atlas-deployed/SET_IS_ATLAS_DEPLOYED';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * The reducer.
 *
 * @param {Boolean} state The state.
 * @param {Object} action The action.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_IS_ATLAS_DEPLOYED) {
    return action.isAtlasDeployed;
  }
  return state;
}

/**
 * Action creator for toggle is atlas deployed events.
 *
 * @param {Boolean} isAtlasDeployed - Is the plugin deployed on Atlas.
 *
 * @returns {Object} The action.
 */
export const setIsAtlasDeployed = (isAtlasDeployed) => ({
  type: SET_IS_ATLAS_DEPLOYED,
  isAtlasDeployed: isAtlasDeployed
});
