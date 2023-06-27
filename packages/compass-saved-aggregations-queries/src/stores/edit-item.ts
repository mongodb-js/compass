import type { Reducer } from 'redux';
import type { FavoriteQuery } from '@mongodb-js/compass-query-bar';
import type { StoredPipeline } from '@mongodb-js/compass-aggregations';
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
  payload: FavoriteQuery | StoredPipeline;
};

export type Actions =
  | EditItemClickedAction
  | EditItemCancelledAction
  | EditItemUpdatedAction;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
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
        : ((await pipelineStorage.updateAttributes(
            id,
            attributes
          )) as StoredPipeline);

    dispatch({
      type: ActionTypes.EditItemUpdated,
      id,
      payload,
    });
  };

export default reducer;
