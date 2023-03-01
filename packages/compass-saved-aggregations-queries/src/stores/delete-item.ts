import { FavoriteQueryStorage } from '@mongodb-js/compass-query-history';
import { PipelineStorage } from '@mongodb-js/compass-aggregations';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import {
  showConfirmation,
  ConfirmationModalVariant,
} from '@mongodb-js/compass-components';

const { track } = createLoggerAndTelemetry('COMPASS-MY-QUERIES-UI');

export enum ActionTypes {
  DeleteItemConfirm = 'compass-saved-aggregations-queries/deleteItemConfirm',
}

const favoriteQueryStorage = new FavoriteQueryStorage();
const pipelineStorage = new PipelineStorage();

type DeleteItemConfirmAction = {
  type: ActionTypes.DeleteItemConfirm;
  id: string;
};

export type Actions = DeleteItemConfirmAction;

export const confirmDeleteItem = (
  id: string
): ThunkAction<Promise<void>, RootState, void, DeleteItemConfirmAction> => {
  return async (dispatch, getState) => {
    const {
      savedItems: { items },
    } = getState();
    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }

    const title = `Are you sure you want to delete your ${
      item.type === 'query' ? 'query' : 'aggregation'
    }?`;
    const confirmed = await showConfirmation({
      title,
      description: 'This action can not be undone.',
      variant: ConfirmationModalVariant.Danger,
      buttonText: 'Delete',
    });
    if (!confirmed) {
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
