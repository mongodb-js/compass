/**
 * Create index columnar projection action.
 */
export const CHANGE_COLUMNAR_PROJECTION =
  'indexes/create-index/columnar-projection/CHANGE_COLUMNAR_PROJECTION';

type ColumnarProjectionState = string;

/**
 * The initial state of the columnar projection.
 */
export const INITIAL_STATE = '';

type ColumnarProjectionAction = {
  type: typeof CHANGE_COLUMNAR_PROJECTION;
  columnarProjection: string;
};

/**
 * Reducer function for handle state changes to create columnar projection.
 *
 * @param {String} state - The create columnar projection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: ColumnarProjectionAction
): ColumnarProjectionState {
  if (action.type === CHANGE_COLUMNAR_PROJECTION) {
    return action.columnarProjection;
  }
  return state;
}

/**
 * The change columnar projection action creator.
 *
 * @param {String} columnarProjection - The columnar projection.
 *
 * @returns {Object} The action.
 */
export const changeColumnarProjection = (
  columnarProjection: string
): ColumnarProjectionAction => ({
  type: CHANGE_COLUMNAR_PROJECTION,
  columnarProjection,
});
