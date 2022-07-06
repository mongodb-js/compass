import type { RootActions, RootState } from './index';
import type { ThunkAction } from 'redux-thunk';
import { EJSON } from 'bson';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-MY-QUERIES-UI');

function padLines(str: string, count = 2) {
  return str
    .split('\n')
    .map((line) => `${' '.repeat(count)}${line}`)
    .join('\n');
}

/**
 * Returns saved pipeline as a string of javascript.
 *
 * This formatting will more or less match the result of default formatting that
 * we have for templates in the pipeline builder. That's the best we can do
 * without actually parsing input to ast and formatting user-generated code with
 * something like prettier.
 */
function formatPipeline(pipeline: Aggregation['pipeline']): string {
  const stages = pipeline
    // It's possible to save pipeline without choosing an operator for a stage
    .filter((stage) => stage.stageOperator)
    .map((stage) => {
      return `{\n  ${stage.stageOperator}: ${padLines(stage.stage).trim()}\n}`;
    });
  if (stages.length > 0) {
    return `[\n${padLines(stages.join(',\n'))}\n]`;
  }
  return '[]';
}

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
        ? formatPipeline(item.aggregation.pipeline)
        : formatQuery(item.query);

    await navigator.clipboard.writeText(copyStr);
  };
}
