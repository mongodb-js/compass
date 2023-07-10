'use strict';
const kDepth = Symbol('kDepth');
const kSBENodes = Symbol('kSBENodes');

function mapPlanTree(stage, mapper, currentParent = null) {
  const result = mapper(stage, currentParent);
  const target = result || {};
  if (stage.inputStage) target.inputStage = mapPlanTree(stage.inputStage, mapper, stage);
  if (stage.innerStage) target.innerStage = mapPlanTree(stage.innerStage, mapper, stage);
  if (stage.outerStage) target.outerStage = mapPlanTree(stage.outerStage, mapper, stage);
  if (stage.thenStage) target.thenStage = mapPlanTree(stage.thenStage, mapper, stage);
  if (stage.elseStage) target.elseStage = mapPlanTree(stage.elseStage, mapper, stage);
  if (stage.inputStages) target.inputStages = stage.inputStages.map(s => mapPlanTree(s, mapper, stage));
  if (stage.shards) target.shards = stage.shards.map(s => mapPlanTree(s, stage));
  if (stage.executionStages) target.executionStages = stage.executionStages.map(s => mapPlanTree(s, mapper, stage));
  return result;
}

function omitChildStages(stage) {
  return mapPlanTree(stage, child => stage === child ? { ...stage } : undefined);
}

function mapStages(queryPlan, sbeExecutionStages) {
  const nodeIdToQueryPlan = new Map();

  // First, look up all stages from the query plan, and store their IDs so
  // that we know which SBE nodes we should assign to which query plan node.
  mapPlanTree(queryPlan, stage => {
    if (stage.planNodeId) {
      nodeIdToQueryPlan.set(stage.planNodeId, stage);
      stage[kSBENodes] = [];
    }
  });
  // Then, map the SBE nodes to query plan nodes and keep track of which
  // depth in the tree they are at.
  mapPlanTree(sbeExecutionStages, (stage, parent) => {
    if (parent) {
      stage[kDepth] = parent[kDepth] + 1;
    } else {
      stage[kDepth] = 0;
    }
    if (stage.planNodeId) {
      nodeIdToQueryPlan.get(stage.planNodeId)[kSBENodes].push(stage);
    }
  });

  // Sort SBE nodes per-height so that we have a clear 'head' node that
  // correponds to the query plan node.
  for (const stage of nodeIdToQueryPlan.values()) {
    stage[kSBENodes].sort((s1, s2) => s1[kDepth] - s2[kDepth]);
  }

  // Do the actual mapping here. Use the head SBE node, and only aggregate
  // 'docsExamined' based on all child nodes and 'executionTimeMillisEstimate'
  // based on all top-level child nodes here.
  return mapPlanTree(queryPlan, stage => {
    const sbeNodes = stage[kSBENodes];
    const headSBENode = sbeNodes[0] || {};
    return {
      ...omitChildStages(headSBENode),
      ...omitChildStages(stage),
      executionTimeMillisEstimate: headSBENode.executionTimeMillis || headSBENode.executionTimeMillisEstimate,
      docsExamined: sbeNodes
        .filter(sbe => sbe.stage === 'seek' || sbe.stage === 'scan')
        .map(sbe => sbe.numReads || 0)
        .reduce((a, b) => a + b, 0),
      keysExamined: sbeNodes
        .filter(sbe => sbe.stage === 'ixseek' || sbe.stage === 'ixscan')
        .map(sbe => sbe.numReads || 0)
        .reduce((a, b) => a + b, 0)
    };
  });
}

function isAggregationExplain(explain) {
  return (
    isUnshardedAggregationExplain(explain) ||
    isShardedAggregationExplain(explain)
  );
}
// Only unshared aggregation has stages property
function isUnshardedAggregationExplain(explain) {
  return !!explain.stages;
}
// Only shared aggregation has shards property
function isShardedAggregationExplain(explain) {
  return !!explain.shards;
}

function isShardedFindExplain(explain) {
  const { mongosPlannerVersion } = explain.queryPlanner ?? {};
  return !isNaN(mongosPlannerVersion);
}

function getStageCursorKey(stage) {
  return Object.keys(stage).find((x) => x.match(/^\$.*cursor/i));
}

function isCursorStage(stage) {
  return !!getStageCursorKey(stage);
}

/**
 * Converts SBE explain plan to a format that is compatible with the query planner.
 * https://wiki.corp.mongodb.com/display/QUERY/Explain+Notes
 *
 * @param {Object} explain Raw explain object.
 * @returns Classic explain object
 */
module.exports = function (explain) {
  explain = JSON.parse(JSON.stringify(explain));

  // In a sharded aggregation, we don't have explainVersion :(
  // In a sharded find, its represented by explain.queryPlanner.mongosPlannerVersion

  // return explain that uses classic engine (except for sharded response)
  if (explain.explainVersion && explain.explainVersion < 2) {
    return explain;
  }
  delete explain.explainVersion;

  if (isAggregationExplain(explain)) {
    if (isShardedAggregationExplain(explain)) {
      explain = mapShardedAggregation(explain);
    } else {
      explain = mapUnshardedAggregation(explain);
    }
  } else {
    if (isShardedFindExplain(explain)) {
      explain = mapShardedFind(explain);
    } else {
      explain = mapUnshardedFind(explain);
    }
  }
  return JSON.parse(JSON.stringify(explain));
};

function mapUnshardedAggregation(explain) {
  if (!explain.stages || explain.stages.length === 0) {
    return explain;
  }
  const stages = explain.stages.map((stage) => {
    if (!isCursorStage(stage)) {
      return stage;
    }
    const stageKey = getStageCursorKey(stage);
    stage[stageKey] = _mapPlannerStage(stage[stageKey]);
    return stage;
  });
  explain.stages = stages;
  return explain;
}
function mapShardedAggregation(explain) {
  if (!explain.shards) {
    return explain;
  }
  const shards = {};
  for (const shardName in explain.shards) {
    // Shard with stages
    if (explain.shards[shardName].stages) {
      shards[shardName] = mapUnshardedAggregation(explain.shards[shardName]);
    } else {
      shards[shardName] = mapUnshardedFind(explain.shards[shardName]);
    }
  }
  explain.shards = shards;
  return explain;
}

function mapShardedFind(explain) {
  const queryPlanner = explain.queryPlanner;
  const executionStats = explain.executionStats;
  if (!queryPlanner.winningPlan.shards) {
    return explain;
  }
  queryPlanner.winningPlan.shards.forEach((shard, index) => {
    const winningPlan = shard.winningPlan.queryPlan;
    if (winningPlan && executionStats) {
      const executionStages = mapStages(
        winningPlan,
        executionStats.executionStages.shards[index].executionStages
      );

      queryPlanner.winningPlan.shards[index].winningPlan = winningPlan;
      executionStats.executionStages.shards[index].executionStages =
        executionStages;
    }
  });
  explain.queryPlanner = queryPlanner;
  explain.executionStats = executionStats;
  return explain;
}
function mapUnshardedFind(explain) {
  return _mapPlannerStage(explain);
}

function _mapPlannerStage(planner) {
  if (
    planner.queryPlanner &&
    planner.queryPlanner.winningPlan &&
    planner.queryPlanner.winningPlan.queryPlan
  ) {
    planner.queryPlanner.plannerVersion = 1;
    const winningPlan = planner.queryPlanner.winningPlan.queryPlan;
    planner.queryPlanner.winningPlan = winningPlan;

    if (planner.executionStats) {
      planner.executionStats.executionStages = mapStages(
        winningPlan,
        planner.executionStats.executionStages
      );
    }
  }
  return planner;
}

module.exports.getStageCursorKey = getStageCursorKey;

module.exports.isAggregationExplain = isAggregationExplain;
module.exports.isShardedAggregationExplain = isShardedAggregationExplain;
module.exports.isShardedFindExplain = isShardedFindExplain;
