import type { MongoDBInstance } from 'mongodb-instance-model';
import type { RootAction } from '.';

/**
 * Instance action.
 */
export const CHANGE_INSTANCE = 'sidebar/instance/CHANGE_INSTANCE' as const;
export interface ChangeInstanceAction {
  type: typeof CHANGE_INSTANCE;
  instance: InstanceState;
}

/**
 * The initial state of the sidebar instance.
 */
export const INITIAL_STATE: InstanceState = null;
export type InstanceState = null | Pick<
  MongoDBInstance,
  | 'status'
  | 'refreshingStatus'
  | 'databasesStatus'
  | 'csfleMode'
  | 'build'
  | 'dataLake'
  | 'genuineMongoDB'
  | 'topologyDescription'
  | 'isWritable'
  | 'env'
  | 'isAtlas'
  | 'isLocalAtlas'
>;
export type InstanceAction = ChangeInstanceAction;

/**
 * Reducer function for handle state changes to sidebar instance.
 *
 * @param {String} state - The sidebar instance state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state: InstanceState = INITIAL_STATE,
  action: RootAction
): InstanceState {
  if (action.type === CHANGE_INSTANCE) {
    return action.instance;
  }
  return state;
}

/**
 * The change instance action creator.
 *
 * @param {String} instance - The instance.
 *
 * @returns {Object} The action.
 */
export const changeInstance = (instance: InstanceState) => ({
  type: CHANGE_INSTANCE,
  instance: instance,
});
