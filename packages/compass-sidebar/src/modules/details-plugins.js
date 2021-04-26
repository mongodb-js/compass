/**
 * The module action prefix.
 */
const PREFIX = 'sidebar/details-plugins';

export const LOAD_DETAILS_PLUGINS = `${PREFIX}/LOAD_DETAILS_PLUGINS`;

/**
 * The initial state.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to details plugins.
 *
 * @param {Boolean} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === LOAD_DETAILS_PLUGINS) {
    return action.roles;
  }
  return state;
};

export default reducer;

/**
 * Load all the instance details plugins.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 *
 * @returns {Array} The details plugins.
 */
export const loadDetailsPlugins = (appRegistry) => ({
  type: LOAD_DETAILS_PLUGINS,
  roles: appRegistry.getRole('InstanceDetails.Item') || []
});
