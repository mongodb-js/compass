import type { RootAction } from '.';

export const locations = {
  database: true,
  collection: true,
  'My Queries': true,
  Databases: true,
};
export type Location = keyof typeof locations;

export const CHANGE_LOCATION = 'sidebar/navigation/CHANGE_LOCATION' as const;
interface ChangeLocationAction {
  type: typeof CHANGE_LOCATION;
  location: Location | null;
}
export type LocationAction = ChangeLocationAction;
export type LocationState = null | Location;

export const INITIAL_STATE = null;

export default function reducer(
  state: LocationState = INITIAL_STATE,
  action: RootAction
): LocationState {
  if (action.type === CHANGE_LOCATION) {
    return action.location;
  }
  return state;
}

export const changeLocation = (
  location: Location | null
): ChangeLocationAction => ({
  type: CHANGE_LOCATION,
  location,
});
