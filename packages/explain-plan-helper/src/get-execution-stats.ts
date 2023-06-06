import {
  isAggregationExplain,
  isShardedAggregationExplain,
  getStageCursorKey,
} from 'mongodb-explain-compat';

import type { Stage, IndexInformation } from './index';

export type ExecutionStats = Partial<{
  executionSuccess: boolean;
  nReturned: number;
  executionTimeMillis: number;
  totalKeysExamined: number;
  totalDocsExamined: number;
  executionStages: Stage;
  allPlansExecution: unknown[];
  stageIndexes: IndexInformation[];
}>;

export const getExecutionStats = (
  explain: Stage
): ExecutionStats | undefined => {
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

  const stats = _getFindStats(firstStage[cursorKey]) ?? {};
  stats.nReturned = lastStage.nReturned;
  stats.stageIndexes = getIndexesFromStages(explain.stages);
  stats.executionTimeMillis = getAggregationExecutionTime(
    stats,
    explain.stages
  );
  return stats;
};
const _getShardedAggregationStats = (explain: Stage): ExecutionStats => {
  const shardStats = [];
  let stageIndexes: IndexInformation[] = [];
  for (const shardName in explain.shards) {
    const stats = explain.shards[shardName].stages
      ? _getUnshardedAggregationStats(explain.shards[shardName])
      : _getFindStats(explain.shards[shardName]);

    shardStats.push({
      shardName,
      ...stats,
    });
    stageIndexes = stageIndexes.concat(
      getIndexesFromStages(explain.shards[shardName].stages ?? [], shardName)
    );
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
    stageIndexes,
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

/**
 *
 * @param stages List of all stages in the explain plan
 * @param shard Shard name
 * @returns Indexes used in the stages
 */
function getIndexesFromStages(
  stages: Stage[],
  shard?: string
): IndexInformation[] {
  return stages
    .reduce((acc: string[], x: Stage) => acc.concat(x?.indexesUsed ?? []), [])
    .map((index: string) => ({ index, shard: shard ?? null, fields: {} }));
}

function getAggregationExecutionTime(
  stats: ExecutionStats,
  stages: Stage[]
): number {
  return (
    // Aggregation execution time is either accessible as part of stats, or as
    // the estimated time of the last stage as execution time for stages is
    // accumulated: every next stage includes the time for the previous stages
    stats.executionTimeMillis ??
    stages[stages.length - 1]?.executionTimeMillisEstimate ??
    0
  );
}
