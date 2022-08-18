import type { AnyAction } from 'redux';

export const locations = {
  database: true,
  collection: true,
  'My Queries': true,
  Databases: true,
};

export const CHANGE_LOCATION = 'sidebar/navigation/CHANGE_LOCATION';

export const INITIAL_STATE = null;

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === CHANGE_LOCATION) {
    return action.location;
  }
  return state;
}

export const changeLocation = (location: keyof typeof locations) => ({
  type: CHANGE_LOCATION,
  location,
});
