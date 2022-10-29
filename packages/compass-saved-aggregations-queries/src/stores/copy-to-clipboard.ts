import type { RootActions, RootState } from './index';
import type { ThunkAction } from 'redux-thunk';
import { EJSON } from 'bson';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-MY-QUERIES-UI');

function formatQuery(query: Query) {
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
): ThunkAction<Promise<void>, RootState, void, RootActions> {
  return async (_dispatch, getState) => {
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
