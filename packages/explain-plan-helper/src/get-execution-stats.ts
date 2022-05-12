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
};

export const getExecutionStats = (explain: Stage): ExecutionStats => {
  const executionStats = isAggregationExplain(explain)
    ? _getAggregationStats(explain)
    : _getFindStats(explain);
  return executionStats;
};
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
  stats.executionTimeMillis = sumArrayProp(
    explain.stages,
    'executionTimeMillisEstimate'
  );
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
      ...stats,
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
      stage: shardStats.length === 1 ? 'SINGLE_SHARD' : 'SHARD_MERGE',
      nReturned,
      executionTimeMillis,
      totalKeysExamined,
      totalDocsExamined,
      shards: shardStats,
    },
  } as unknown as ExecutionStats;

  return response;
};
const _getFindStats = (explain: Stage): ExecutionStats => {
  return explain.executionStats;
};

function sumArrayProp<T>(arr: T[], prop: keyof T): number {
  return arr.reduce((acc, x) => acc + Number(x[prop] ?? 0), 0);
}
