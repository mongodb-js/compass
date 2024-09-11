import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

export type IndexView = 'regular-indexes' | 'search-indexes';

export enum ActionTypes {
  IndexViewChanged = 'compass-indexes/index-list/index-view-changed',
}

type IndexViewChangedAction = {
  type: ActionTypes.IndexViewChanged;
  view: IndexView;
};

export const INITIAL_STATE: IndexView = 'regular-indexes';

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (isAction<IndexViewChangedAction>(action, ActionTypes.IndexViewChanged)) {
    return action.view;
  }

  // TODO: when index creation starts, switch to regular-indexes

  return state;
}

export const indexViewChanged = (view: IndexView): IndexViewChangedAction => ({
  type: ActionTypes.IndexViewChanged,
  view: view,
});

export const switchToRegularIndexes = () => indexViewChanged('regular-indexes');
export const switchToSearchIndexes = () => indexViewChanged('search-indexes');
