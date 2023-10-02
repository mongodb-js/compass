import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

export type IndexView = 'regular-indexes' | 'search-indexes';

export enum ActionTypes {
  ChangeIndexView = 'index-list/ChangeIndexView',
}

type ChangeIndexViewAction = {
  type: ActionTypes.ChangeIndexView;
  view: IndexView;
};

export const INITIAL_STATE: IndexView = 'regular-indexes';

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (isAction<ChangeIndexViewAction>(action, ActionTypes.ChangeIndexView)) {
    return action.view;
  }

  return state;
}

export const changeIndexView = (view: IndexView): ChangeIndexViewAction => ({
  type: ActionTypes.ChangeIndexView,
  view: view,
});

export const switchToRegularIndexes = () => changeIndexView('regular-indexes');
export const switchToSearchIndexes = () => changeIndexView('search-indexes');
