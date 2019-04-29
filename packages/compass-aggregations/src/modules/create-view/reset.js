/**
 * The reset action name.
 */
export const RESET = 'aggregations/create-view/reset';

/**
 * Reset the state action.
 *
 * @return {Object} The action creator.
 */
export const reset = () => ({
  type: RESET
});
