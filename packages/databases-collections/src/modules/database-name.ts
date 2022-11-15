import type { AnyAction } from 'redux';

/**
 * Create database name.
 */
export const CHANGE_DATABASE_NAME = 'databases-collections/name/CHANGE_DATABASE_NAME';

/**
 * The initial state of the database name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create database name.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction): string {
  if (action.type === CHANGE_DATABASE_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 */
export const changeDatabaseName = (name: string, collections = []) => ({
  type: CHANGE_DATABASE_NAME,
  name,
  collections
});
