import type { SavedQueryAggregationThunkAction } from '.';
import {
  showConfirmation,
  ConfirmationModalVariant,
} from '@mongodb-js/compass-components';

export enum ActionTypes {
  DeleteItemConfirm = 'compass-saved-aggregations-queries/deleteItemConfirm',
}

type DeleteItemConfirmAction = {
  type: ActionTypes.DeleteItemConfirm;
  id: string;
};

export type Actions = DeleteItemConfirmAction;

export const confirmDeleteItem = (
  id: string
): SavedQueryAggregationThunkAction<Promise<void>, DeleteItemConfirmAction> => {
  return async (
    dispatch,
    getState,
    { pipelineStorage, queryStorage, logger: { track } }
  ) => {
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
      item.type === 'aggregation'
        ? 'Aggregation Deleted'
        : 'Query History Favorite Removed',
      {
        id: item.id,
        screen: 'my_queries',
      }
    );

    const deleteAction =
      item.type === 'query'
        ? queryStorage.delete.bind(queryStorage)
        : pipelineStorage.delete.bind(pipelineStorage);
    await deleteAction(item.id);
    dispatch({ type: ActionTypes.DeleteItemConfirm, id: item.id });
  };
};
