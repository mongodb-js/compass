import {
  isAggregationExplain,
  isShardedAggregationExplain,
  isShardedFindExplain,
  getStageCursorKey,
} from 'mongodb-explain-compat';

import type { Stage } from './index';

type PlannerInfo = {
  namespace: string;
  parsedQuery: Stage;
  winningPlan: Stage;
};

export const getPlannerInfo = (explain: Stage): PlannerInfo => {
  const queryPlanner = isAggregationExplain(explain)
    ? _getAggregationPlanner(explain)
    : _getFindPlanner(explain);
  return {
    namespace: queryPlanner.namespace,
    parsedQuery: queryPlanner.parsedQuery,
    winningPlan: queryPlanner.winningPlan,
  };
};
const _getAggregationPlanner = (explain: Stage): Stage => {
  return isShardedAggregationExplain(explain)
    ? _getShardedAggregationPlanner(explain)
    : _getUnshardedAggregationPlanner(explain);
};
const _getUnshardedAggregationPlanner = (explain: Stage): Stage => {
  const firstStage = explain.stages[0];
  const cursorKey = getStageCursorKey(firstStage);
  if (!cursorKey) {
    throw new Error('Can not find a cursor stage.');
  }
  return _getUnshardedFindPlanner(firstStage[cursorKey]);
};
const _getShardedAggregationPlanner = (explain: Stage): Stage => {
  // The first shard
  const firstShardName = Object.keys(explain.shards)[0];
  const firstShard = explain.shards[firstShardName];
  if (firstShard.stages) {
    return _getUnshardedAggregationPlanner(firstShard);
  }
  return _getUnshardedFindPlanner(firstShard);
};
const _getFindPlanner = (explain: Stage): Stage => {
  return isShardedFindExplain(explain)
    ? _getShardedFindPlanner(explain)
    : _getUnshardedFindPlanner(explain);
};
const _getUnshardedFindPlanner = (explain: Stage): Stage => {
  return explain.queryPlanner;
};
const _getShardedFindPlanner = (explain: Stage): Stage => {
  return explain.queryPlanner.winningPlan.shards[0];
};
