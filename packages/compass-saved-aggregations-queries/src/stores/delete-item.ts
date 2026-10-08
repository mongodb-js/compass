import type { SavedQueryAggregationThunkAction } from '.';
import {
  showConfirmation,
  ConfirmationModalVariant,
  translate,
} from '@mongodb-js/compass-components';

export const ActionTypes = {
  DeleteItemConfirm: 'compass-saved-aggregations-queries/deleteItemConfirm',
} as const;

type DeleteItemConfirmAction = {
  type: typeof ActionTypes.DeleteItemConfirm;
  id: string;
};

export type Actions = DeleteItemConfirmAction;

export const confirmDeleteItem = (
  id: string
): SavedQueryAggregationThunkAction<Promise<void>, DeleteItemConfirmAction> => {
  return async (
    dispatch,
    getState,
    { pipelineStorage, queryStorage, track, preferencesAccess }
  ) => {
    const {
      savedItems: { items },
    } = getState();
    const item = items.find((x) => x.id === id);
    if (!item) {
      return;
    }

    const language = preferencesAccess.getPreferences().language ?? 'en';
    const title =
      item.type === 'query'
        ? translate(
            language,
            'savedQueries.delete.titleQuery',
            'Are you sure you want to delete your query?'
          )
        : translate(
            language,
            'savedQueries.delete.titleAggregation',
            'Are you sure you want to delete your aggregation?'
          );
    const confirmed = await showConfirmation({
      title,
      description: translate(
        language,
        'savedQueries.delete.description',
        'This action can not be undone.'
      ),
      variant: ConfirmationModalVariant.Danger,
      buttonText: translate(language, 'savedQueries.delete.button', 'Delete'),
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
      },
      undefined // this event is connection scoped when triggered from the aggregation or query screen
    );

    switch (item.type) {
      case 'aggregation':
        await pipelineStorage?.delete(item.id);
        break;
      case 'query':
      case 'updatemany':
        await queryStorage?.delete(item.id);
        break;
    }

    dispatch({ type: ActionTypes.DeleteItemConfirm, id: item.id });
  };
};
