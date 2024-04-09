import { ConnectionInfo } from '@mongodb-js/connection-info';
import type { RootAction } from '.';

/**
 * The prefix.
 */
const PREFIX = 'sidebar/is-genuine-mongodb-visible' as const;

/**
 * Toggle is visible.
 */
export const TOGGLE_IS_GENUINE_MONGODB_VISIBLE =
  `${PREFIX}/TOGGLE_IS_GENUINE_MONGODB_VISIBLE` as const;
interface ToggleIsGenuineMongoDBVisibleAction {
  type: typeof TOGGLE_IS_GENUINE_MONGODB_VISIBLE;
  connectionId: ConnectionInfo['id'];
  isVisible: boolean;
}
export type IsGenuineMongoDBVisibleAction = ToggleIsGenuineMongoDBVisibleAction;
export type IsGenuineMongoDBVisibleState = Record<
  ConnectionInfo['id'],
  boolean
>;
export type IsGenuineMongoDBVisibleSingleState = boolean;

/**
 * The initial state of the is visible attribute.
 */
export const INITIAL_STATE: IsGenuineMongoDBVisibleState = {};

/**
 * Reducer function for handle state changes to is visible.
 *
 * @param {Boolean} state - The is visible state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(
  state: IsGenuineMongoDBVisibleState = INITIAL_STATE,
  action: RootAction
): IsGenuineMongoDBVisibleState {
  if (action.type === TOGGLE_IS_GENUINE_MONGODB_VISIBLE) {
    return {
      ...state,
      [action.connectionId]: action.isVisible,
    };
  }
  return state;
}

/**
 * The toggle is visible action creator.
 *
 * @param {Boolean} isVisible - Is visible.
 *
 * @returns {Object} The action.
 */
export const toggleIsGenuineMongoDBVisible = (
  connectionId: ConnectionInfo['id'],
  isVisible: boolean
): ToggleIsGenuineMongoDBVisibleAction => ({
  type: TOGGLE_IS_GENUINE_MONGODB_VISIBLE,
  connectionId,
  isVisible,
});
