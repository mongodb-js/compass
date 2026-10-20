import type { SavedQueryAggregationThunkAction } from './index';
import { prettify } from '@mongodb-js/compass-editor';
import type { FavoriteQuery } from '@mongodb-js/my-queries-storage';

function formatQuery(query: FavoriteQuery) {
  const { collation, filter, limit, project, skip, sort } = query;
  // Values can end with a line comment, so separators go on the next line.
  const source = `{\n${Object.entries({
    collation,
    filter,
    limit,
    project,
    skip,
    sort,
  })
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}: ${value}\n`)
    .join(',')}}`;
  try {
    return prettify(source);
  } catch {
    return source;
  }
}

export function copyToClipboard(
  id: string
): SavedQueryAggregationThunkAction<Promise<void>> {
  return async (_dispatch, getState, { track }) => {
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
