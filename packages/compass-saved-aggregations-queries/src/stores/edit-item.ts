import type { Reducer } from 'redux';
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';

export type UpdateAttributes = Record<string, unknown>;

export type State = {
  id: string | undefined;
};

const INITIAL_STATE: State = {
  id: undefined,
};

export enum ActionTypes {
  ItemEdited = 'compass-saved-aggregations-queries/edit-item/itemEdited',
  ItemUpdated = 'compass-saved-aggregations-queries/edit-item/itemUpdated',
}

type ItemEditedAction = {
  type: ActionTypes.ItemEdited;
  id: string;
};

type ItemUpdatedAction = {
  type: ActionTypes.ItemUpdated;
};

export type Actions = ItemEditedAction | ItemUpdatedAction;

const favoriteQueryStorage = new FavoriteQueryStorage();
const pipelineStorage = new PipelineStorage();

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ItemEdited:
      return {
        id: action.id,
      }
    case ActionTypes.ItemUpdated:
      return {
        id: undefined
      };
    default:
      return state;
  }
};

export const editItem = (id: string): ItemEditedAction => {
  return {
    type: ActionTypes.ItemEdited,
    id,
  }
};

export const updateItem = (itemId: string, attributes: UpdateAttributes): ThunkAction<void, RootState, void, Actions> =>
  async (dispatch, getState) => {
    const { savedItems: { items } } = getState();

    const item = items.find(x => x.id === itemId);
    if (!item) {
      return;
    }

    const updateAction = item.type === 'query'
      ? favoriteQueryStorage.updateAttributes.bind(favoriteQueryStorage)
      : pipelineStorage.updateAttributes.bind(pipelineStorage);

    await updateAction(itemId, attributes);

    dispatch({
      type: ActionTypes.ItemUpdated
    });
  };

export default reducer;
