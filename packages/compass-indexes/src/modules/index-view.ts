import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

import type { CreateIndexOpenedAction } from './create-index';
import { ActionTypes as CreateIndexActionTypes } from './create-index';

import type { CreateSearchIndexOpenedAction } from './search-indexes';
import { ActionTypes as SearchIndexActionTypes } from './search-indexes';

export type IndexView = 'regular-indexes' | 'search-indexes';

export enum ActionTypes {
  IndexViewChanged = 'compass-indexes/index-list/index-view-changed',
}

export type IndexViewChangedAction = {
  type: ActionTypes.IndexViewChanged;
  view: IndexView;
};

export const INITIAL_STATE: IndexView = 'regular-indexes';

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): IndexView {
  // The create index button has a dropdown where you can select regular or
  // search index and then open the appropriate modal regardless of what view
  // the user is on. This switches to the appropriate view so the user can see
  // the newly created index.
  if (
    isAction<CreateIndexOpenedAction>(
      action,
      CreateIndexActionTypes.CreateIndexOpened
    )
  ) {
    return 'regular-indexes';
  }
  if (
    isAction<CreateSearchIndexOpenedAction>(
      action,
      SearchIndexActionTypes.CreateSearchIndexOpened
    )
  ) {
    return 'search-indexes';
  }

  if (isAction<IndexViewChangedAction>(action, ActionTypes.IndexViewChanged)) {
    return action.view;
  }

  return state;
}

export const indexViewChanged = (view: IndexView): IndexViewChangedAction => ({
  type: ActionTypes.IndexViewChanged,
  view: view,
});

export const switchToRegularIndexes = () => indexViewChanged('regular-indexes');
export const switchToSearchIndexes = () => indexViewChanged('search-indexes');
