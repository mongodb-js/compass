import {
  isAggregationExplain,
  isShardedAggregationExplain,
  getStageCursorKey,
} from 'mongodb-explain-compat';

import type { Stage } from './index';

export type ExecutionStats = {
  executionSuccess: boolean;
  nReturned: number;
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  executionStages: Stage;
  allPlansExecution: unknown[];
}

type PlannerInfo = {
  namespace: string;
  parsedQuery: Stage;
}

export const getPlannerInfo = (explain: Stage): PlannerInfo => {
  const queryPlanner = isAggregationExplain(explain)
    ? _getAggregationPlanner(explain)
    : _getFindPlanner(explain);
  return {
    namespace: queryPlanner.namespace,
    parsedQuery: queryPlanner.parsedQuery,
  };
}
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
  return _getFindPlanner(firstStage[cursorKey]);
};
const _getShardedAggregationPlanner = (explain: Stage): Stage => {
  // The first shard
  const firstShardName = Object.keys(explain.shards)[0];
  const firstShard = explain.shards[firstShardName];
  if (firstShard.stages) {
    return _getUnshardedAggregationPlanner(firstShard);
  }
  return _getFindPlanner(firstShard);
};
const _getFindPlanner = (explain: Stage): Stage => {
  return explain.queryPlanner;
};

export const getExecutionStats = (explain: Stage): ExecutionStats => {
  const executionStats = isAggregationExplain(explain)
    ? _getAggregationStats(explain)
    : _getFindStats(explain);
  return executionStats;
}
const _getAggregationStats = (explain: Stage): ExecutionStats => {
  return isShardedAggregationExplain(explain)
    ? _getShardedAggregationStats(explain)
    : _getUnshardedAggregationStats(explain);
};
const _getUnshardedAggregationStats = (explain: Stage): ExecutionStats => {
  const firstStage = explain.stages[0];
  const cursorKey = getStageCursorKey(firstStage);
  if (!cursorKey) {
    throw new Error('Can not find a cursor stage.');
  }

  const lastStage = explain.stages[explain.stages.length - 1];

  const stats = _getFindStats(firstStage[cursorKey]);
  stats.nReturned = lastStage.nReturned;
  stats.executionTimeMillis = sumArrayProp(explain.stages, 'executionTimeMillisEstimate');
  return stats;
};
const _getShardedAggregationStats = (explain: Stage): ExecutionStats => {
  const shardStats = [];
  for (const shardName in explain.shards) {
    const stats = explain.shards[shardName].stages
      ? _getUnshardedAggregationStats(explain.shards[shardName])
      : _getFindStats(explain.shards[shardName]);

    shardStats.push({
      shardName,
      ...stats
    });
  }

  const nReturned = sumArrayProp(shardStats, 'nReturned');
  const executionTimeMillis = sumArrayProp(shardStats, 'executionTimeMillis');
  const totalKeysExamined = sumArrayProp(shardStats, 'totalKeysExamined');
  const totalDocsExamined = sumArrayProp(shardStats, 'totalDocsExamined');
  const response = {
    nReturned,
    executionTimeMillis,
    totalKeysExamined,
    totalDocsExamined,
    allPlansExecution: [],
    executionSuccess: true,
    executionStages: {
      stage: shardStats.length === 1 ? "SINGLE_SHARD" : "SHARD_MERGE",
      nReturned,
      executionTimeMillis,
      totalKeysExamined,
      totalDocsExamined,
      shards: shardStats,
    }
  } as unknown as ExecutionStats;

  return response;
};
const _getFindStats = (explain: Stage): ExecutionStats => {
  return explain.executionStats;
};


function sumArrayProp<T>(arr: T[], prop: keyof T): number {
  return arr.reduce((acc, x) => acc + Number(x[prop] ?? 0), 0);
};