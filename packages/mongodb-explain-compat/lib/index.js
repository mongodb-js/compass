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
  return !!explain.stages;
}

function isFirstStageCursorType(stages) {
  return !!getStageCursorKey(stages[0]);
}

function getStageCursorKey(stage) {
  return Object.keys(stage).find((x) => x.match(/cursor/i));
}

/**
 * https://wiki.corp.mongodb.com/display/QUERY/Explain+Notes
 */
function mapAggregationExplain(explain) {
  if (!explain.stages || explain.stages.length === 0) {
    return explain;
  }
  // In aggregations for SBE, the cursor based stage is always first.
  if (!isFirstStageCursorType(explain.stages)) {
    return explain;
  }

  const firstStage = explain.stages[0];
  const firstStageKey = getStageCursorKey(firstStage);
  const winningPlan =
    firstStage[firstStageKey].queryPlanner.winningPlan.queryPlan;
  firstStage[firstStageKey].queryPlanner.winningPlan = winningPlan;

  firstStage[firstStageKey].executionStats.executionStages = mapStages(
    winningPlan,
    firstStage[firstStageKey].executionStats.executionStages
  );
  firstStage[firstStageKey].queryPlanner.plannerVersion = 1;
  return explain;
}

function mapQueryExplain(explain) {
  explain.queryPlanner.plannerVersion = 1;
  const winningPlan = explain.queryPlanner.winningPlan.queryPlan;
  explain.queryPlanner.winningPlan = winningPlan;

  explain.executionStats.executionStages = mapStages(
    winningPlan,
    explain.executionStats.executionStages
  );

  return explain;
}

module.exports = function (explain) {
  explain = JSON.parse(JSON.stringify(explain));
  if ((explain.explainVersion || 0) < 2) {
    return explain;
  }
  delete explain.explainVersion;
  if (isAggregationExplain(explain)) {
    explain = mapAggregationExplain(explain);
  } else {
    explain = mapQueryExplain(explain);
  }
  return JSON.parse(JSON.stringify(explain));
};
