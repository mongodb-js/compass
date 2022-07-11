import type { Reducer } from 'redux';
import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-MY-QUERIES-UI');

export enum ActionTypes {
  DeleteItem = 'compass-saved-aggregations-queries/deleteItem',
  DeleteItemConfirm = 'compass-saved-aggregations-queries/deleteItemConfirm',
  DeleteItemCancel = 'compass-saved-aggregations-queries/deleteItemCancel',
}

const favoriteQueryStorage = new FavoriteQueryStorage();
const pipelineStorage = new PipelineStorage();

type DeleteItemAction = {
  type: ActionTypes.DeleteItem;
  id: string;
};

type DeleteItemCancelAction = {
  type: ActionTypes.DeleteItemCancel;
};

type DeleteItemConfirmAction = {
  type: ActionTypes.DeleteItemConfirm;
  id: string;
};

export type Actions =
  | DeleteItemAction
  | DeleteItemCancelAction
  | DeleteItemConfirmAction;

export type State = {
  id: string | null;
};

const INITIAL_STATE: State = {
  id: null,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.DeleteItem:
      return { id: action.id };
    case ActionTypes.DeleteItemCancel:
      return { id: null };
    case ActionTypes.DeleteItemConfirm:
      return { id: null };
    default:
      return state;
  }
};

export const deleteItem = (id: string): DeleteItemAction => {
  return { type: ActionTypes.DeleteItem, id };
};

export const deleteItemCancel = (): DeleteItemCancelAction => {
  return { type: ActionTypes.DeleteItemCancel };
};

export const deleteItemConfirm = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      savedItems: { items },
      deleteItem: { id },
    } = getState();
    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }

    track(
      item.type == 'aggregation'
        ? 'Aggregation Deleted'
        : 'Query History Favorite Removed',
      {
        id: item.id,
        screen: 'my_queries',
      }
    );

    const deleteAction =
      item.type === 'query'
        ? favoriteQueryStorage.delete.bind(favoriteQueryStorage)
        : pipelineStorage.delete.bind(pipelineStorage);
    await deleteAction(item.id);
    dispatch({ type: ActionTypes.DeleteItemConfirm, id: item.id });
  };
};

export default reducer;
