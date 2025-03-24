import type { RootAction } from '.';
import { isAction } from '../util';
import { ValidationActions } from './validation';
import type {
  EmptyValidationFetchedAction,
  ValidationFetchedAction,
  ValidationFetchErroredAction,
} from './validation';

export const IS_LOADED_CHANGED =
  'validation/namespace/IS_LOADED_CHANGED' as const;
interface IsLoadedChangedAction {
  type: typeof IS_LOADED_CHANGED;
  isLoaded: boolean;
}

export type IsLoadedAction = IsLoadedChangedAction;
export type IsLoadedState = boolean;

export const INITIAL_STATE: IsLoadedState = false;

export default function reducer(
  state: IsLoadedState = INITIAL_STATE,
  action: RootAction
): IsLoadedState {
  if (
    isAction<ValidationFetchedAction>(
      action,
      ValidationActions.ValidationFetched
    ) ||
    isAction<EmptyValidationFetchedAction>(
      action,
      ValidationActions.EmptyValidationFetched
    ) ||
    isAction<ValidationFetchErroredAction>(
      action,
      ValidationActions.ValidationFetchErrored
    )
  ) {
    return true;
  }

  if (action.type === IS_LOADED_CHANGED) {
    return action.isLoaded;
  }

  return state;
}

export const isLoadedChanged = (isLoaded: boolean): IsLoadedChangedAction => ({
  type: IS_LOADED_CHANGED,
  isLoaded,
});
