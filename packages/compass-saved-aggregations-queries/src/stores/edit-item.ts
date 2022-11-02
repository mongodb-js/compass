import type { Reducer } from 'redux';
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { Query } from '@mongodb-js/compass-query-history';
import type { StoredPipeline } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';

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
  payload: Query | StoredPipeline;
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
  ): ThunkAction<void, RootState, void, Actions> =>
  async (dispatch, getState) => {
    const {
      savedItems: { items },
    } = getState();

    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }
    const payload =
      item.type === 'query'
        ? await updateQuery(id, attributes)
        : await updateAggregation(id, attributes);

    dispatch({
      type: ActionTypes.EditItemUpdated,
      id,
      payload,
    });
  };

const updateQuery = (id: string, attributes: UpdateItemAttributes) => {
  const favoriteQueryStorage = new FavoriteQueryStorage();
  return favoriteQueryStorage.updateAttributes(id, {
    _name: attributes.name,
  });
};

const updateAggregation = (id: string, attributes: UpdateItemAttributes) => {
  const pipelineStorage = new PipelineStorage();
  return pipelineStorage.updateAttributes(id, {
    name: attributes.name,
  }) as Promise<StoredPipeline>;
};

export default reducer;
