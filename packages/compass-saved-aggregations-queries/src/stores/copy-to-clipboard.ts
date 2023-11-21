import type { SavedQueryAggregationThunkAction } from './index';
import { EJSON } from 'bson';
import { type FavoriteQuery } from '@mongodb-js/my-queries-storage';

function formatQuery(query: FavoriteQuery) {
  const { collation, filter, limit, project, skip, sort } = query;
  return EJSON.stringify(
    {
      collation,
      filter,
      limit,
      project,
      skip,
      sort,
    },
    undefined,
    2
  );
}

export function copyToClipboard(
  id: string
): SavedQueryAggregationThunkAction<Promise<void>> {
  return async (_dispatch, getState, { logger: { track } }) => {
    const {
      savedItems: { items },
    } = getState();

    const item = items.find((item) => item.id === id);

    if (!item) {
      return;
    }

    track(
      item.type === 'aggregation'
        ? 'Aggregation Copied'
        : 'Query History Favorite Copied',
      {
        id: item.id,
        screen: 'my_queries',
      }
    );

    const copyStr =
      item.type === 'aggregation'
        ? item.aggregation.pipelineText
        : formatQuery(item.query);

    await navigator.clipboard.writeText(copyStr);
  };
}
