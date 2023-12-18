import type { Reducer } from 'redux';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';
import type { SavedPipeline } from '@mongodb-js/my-queries-storage';
import type { SavedQueryAggregationThunkAction } from '.';

export type UpdateItemAttributes = {
  name: string;
};

export type State = {
  id: string | undefined;
};

const INITIAL_STATE: State = {
  id: undefined,
};

export enum ActionTypes {
  EditItemClicked = 'compass-saved-aggregations-queries/edit-item/editItemClicked',
  EditItemCancelled = 'compass-saved-aggregations-queries/edit-item/editItemCancelled',
  EditItemUpdated = 'compass-saved-aggregations-queries/edit-item/editItemUpdated',
}

type EditItemClickedAction = {
  type: ActionTypes.EditItemClicked;
  id: string;
};

type EditItemCancelledAction = {
  type: ActionTypes.EditItemCancelled;
};

type EditItemUpdatedAction = {
  type: ActionTypes.EditItemUpdated;
  id: string;
  payload: FavoriteQuery | SavedPipeline;
};

export type Actions =
  | EditItemClickedAction
  | EditItemCancelledAction
  | EditItemUpdatedAction;

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.EditItemClicked:
      return {
        id: action.id,
      };
    case ActionTypes.EditItemCancelled:
    case ActionTypes.EditItemUpdated:
      return {
        id: undefined,
      };
    default:
      return state;
  }
};

export const editItem = (id: string): EditItemClickedAction => ({
  type: ActionTypes.EditItemClicked,
  id,
});

export const cancelEditItem = (): EditItemCancelledAction => ({
  type: ActionTypes.EditItemCancelled,
});

export const updateItem =
  (
    id: string,
    attributes: UpdateItemAttributes
  ): SavedQueryAggregationThunkAction<void, Actions> =>
  async (dispatch, getState, { queryStorage, pipelineStorage }) => {
    const {
      savedItems: { items },
    } = getState();

    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }
    const payload =
      item.type === 'query'
        ? await queryStorage.updateAttributes(id, {
            _name: attributes.name,
            _dateModified: new Date(),
          })
        : await pipelineStorage.updateAttributes(id, attributes);

    dispatch({
      type: ActionTypes.EditItemUpdated,
      id,
      payload,
    });
  };

export default reducer;
