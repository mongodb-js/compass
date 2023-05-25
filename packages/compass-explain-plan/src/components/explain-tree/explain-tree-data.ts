import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { omit } from 'lodash';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { debug } = createLoggerAndTelemetry('COMPASS-EXPLAIN-UI');

export type ExplainStageHighlights = Record<string, any>;
export type ExplainStageDetails = Record<string, any>;
export type ExplainTreeNodeData = {
  id: string;
  name: string;
  nReturned: number;
  /* Amount of time spent on this stage */
  curStageExecTimeMS: number;
  /* Execution time spent on all the input stages of this stage, this is the
   * max of the execution times of the children. */
  prevStageExecTimeMS: number;
  isShard: boolean;
  /* ExplainTreeNodeData for the input stages */
  children: ExplainTreeNodeData[];
  /* Raw stage properties */
  details: ExplainStageDetails;
  /* A map of relevant details for the current stage */
  highlights: ExplainStageHighlights;
};

const parseExplainTree = (
  node: Stage,
  counter: { count: number }
): ExplainTreeNodeData => {
  const id = counter.count++;
  const parsedChildren: ExplainTreeNodeData[] = [
    ...ExplainPlan.getChildStages(node),
  ].map((child: Stage) => parseExplainTree(child, counter));

  const isShard = !!node.shardName;

  // NOTE: if there are children we pick the max time, this assume that the children
  // are executed in parallel (for example with shards). It may make sense to
  // double check if this is a correct assumption also for other types of explain plans
  // and if we won't need to sum the previous times in some instances instead.
  const inputStagesExecTime = parsedChildren.length
    ? Math.max(...parsedChildren.map((c) => c.curStageExecTimeMS))
    : 0;

  const executionTimeMillisEstimate =
    node.executionTimeMillisEstimate !== undefined
      ? node.executionTimeMillisEstimate
      : node.executionTimeMillis;

  // if is a shard or if for some reason the current execution time for the node can't be found
  // we assume the node is not an execution stage and keep using the execution time of the
  // input stages
  const currentStageExecTime =
    isShard || executionTimeMillisEstimate === undefined
      ? inputStagesExecTime
      : executionTimeMillisEstimate;

  const stage: Omit<ExplainTreeNodeData, 'highlights'> = {
    id: `stage-${id}`,
    name: node.stage || node.shardName,
    nReturned: node.nReturned,
    curStageExecTimeMS: currentStageExecTime,
    prevStageExecTimeMS: inputStagesExecTime,
    isShard: isShard,
    details: omit(node, [
      'inputStage',
      'inputStages',
      'shards',
      'executionStages',
    ]),
    children: parsedChildren,
  };
  return { ...stage, highlights: extractHighlights(stage) };
};

const extractHighlights = (stage: Omit<ExplainTreeNodeData, 'highlights'>) => {
  switch (stage.name) {
    case 'IXSCAN':
      return {
        'Index Name': stage.details?.indexName,
        'Multi Key Index': stage.details?.isMultiKey,
      };
    case 'PROJECTION':
      return {
        'Transform by': JSON.stringify(stage.details?.transformBy),
      };
    case 'COLLSCAN':
      return {
        'Documents Examined': stage.details?.docsExamined,
      };
    default:
      return {};
  }
};

export const executionStatsToTreeData = (
  executionStats: ExplainPlan['executionStats']
): ExplainTreeNodeData | undefined => {
  const executionStages = executionStats?.executionStages;
  try {
    return executionStages
      ? parseExplainTree(executionStages, { count: 0 })
      : undefined;
  } catch (e) {
    debug('Error while building the treeModel', e);
    return undefined;
  }
};
