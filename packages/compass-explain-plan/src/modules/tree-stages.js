import { has, omit, map, isPlainObject, keys, max, maxBy, minBy, forEach } from 'lodash';
import d3 from 'd3';
import STAGE_CARD_PROPERTIES from 'constants/stage-card-properties';
import { format } from 'util';

const debug = require('debug')('mongodb-compass:stores:explain-tree-stages');

// This plugin allows for tree layout of variable-sized nodes
window.d3 = global.d3 = d3;
require('d3-flextree/dist/d3-flextree.js');

/**
 * The prefix.
 */
const PREFIX = 'explain/tree-stages';

/**
 * The tree stages changed action name.
 */
export const TREE_STAGES_CHANGED = `${PREFIX}/TREE_STAGES_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  nodes: [],
  links: [],
  width: 0,
  height: 0
};

/**
 * Helper function to extract highlight values out of a stage. For example,
 * the IXSCAN stage has the fields "Index Name" and "Multi Key Index"
 * highlighted above the "Details" section.
 *
 * @param {Object} stage - Current stage to extract highlights from
 *
 * @return {Object} Object, where key is the highlight name and
 * value is the matching value.
 */
const extractHighlights = (stage) => {
  switch (stage.name) {
    case 'IXSCAN': return {
      'Index Name': stage.details.indexName,
      'Multi Key Index': stage.details.isMultiKey
    };
    case 'PROJECTION': return {
      'Transform by': JSON.stringify(stage.details.transformBy)
    };
    case 'COLLSCAN': return {
      'Documents Examined': stage.details.docsExamined
    };
    default: return {};
  }
};

/**
 * Helper method to parse the explain output. Recursively applied to all
 * stages of the explain tree.
 *
 * @param {Object} parent - The parent stage, or undefined for the root stage
 * @param {Object} obj - The (nested) object of the raw explain output
 * that is currently being processed.
 *
 * @return {Object} Root stage with nested `children` array.
 */
const parseExplain = (parent, obj) => {
  if (obj === undefined) {
    obj = parent;
    parent = undefined;
  }

  const stage = {
    name: obj.stage || obj.shardName,
    nReturned: obj.nReturned,
    curStageExecTimeMS: (obj.executionTimeMillisEstimate !== undefined)
      ? obj.executionTimeMillisEstimate
      : obj.executionTimeMillis,
    details: omit(obj, ['inputStage', 'inputStages', 'shards', 'executionStages']),
    x: obj.x,
    y: obj.y,
    depth: obj.depth,
    isShard: !!obj.shardName,
    parent
  };

  // Extract highlights relevant for the current stage from details
  stage.highlights = extractHighlights(stage);

  // Recursively parse child or children of this stage
  const children = (
    obj.inputStage ||
    obj.inputStages ||
    obj.shards ||
    obj.executionStages
  );

  if (Array.isArray(children)) {
    stage.children = map(children, parseExplain.bind(this, stage));
  } else if (isPlainObject(children)) {
    stage.children = [parseExplain(stage, children)];
  } else {
    stage.children = [];
  }

  return stage;
};

/**
 * Helper method to recursively compute previous and current execution
 * times for each stage of the explain tree. Applied to the output of
 * _parseExplain().
 *
 * @param  {Object} node - The current node to process
 * @return {Number} The execution time for the current node
 */
const computeExecTimes = (node) => {
  if (!node.children || node.children.length === 0) {
    // Leaf nodes
    node.prevStageExecTimeMS = 0;
  } else {
    const execTimes = map(node.children, computeExecTimes.bind(this));

    node.prevStageExecTimeMS = max(execTimes);
  }

  if (node.isShard) {
    node.curStageExecTimeMS = node.prevStageExecTimeMS;
  }

  // Never return negative values
  node.curStageExecTimeMS = Math.max(0, node.curStageExecTimeMS);

  return node.curStageExecTimeMS;
};

/**
 * Changes tree stages.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const changeTreeStages = (state, action) => {
  const explain = action.explain;

  if (!has(explain.rawExplainObject, 'executionStats.executionStages')) {
    return INITIAL_STATE;
  }

  const parsedExplain = parseExplain(
    explain.rawExplainObject.executionStats.executionStages
  );

  const tree = d3.layout.flextree()
    .setNodeSizes(true)
    .nodeSize((d) => {
      const shardHeight = STAGE_CARD_PROPERTIES.SHARD_CARD_HEIGHT;
      const notShardHeight = STAGE_CARD_PROPERTIES.DEFAULT_CARD_HEIGHT +
        (
          keys(d.highlights).length *
          STAGE_CARD_PROPERTIES.HIGHLIGHT_FIELD_HEIGHT
        );
      let height = d.isShard ? shardHeight : notShardHeight;

      height += STAGE_CARD_PROPERTIES.VERTICAL_PADDING;

      return [STAGE_CARD_PROPERTIES.DEFAULT_CARD_WIDTH, height];
    })
    .spacing((a, b) => (a.parent === b.parent ? 40 : 70));

  // Compute nodes and links
  const nodes = tree.nodes(parsedExplain);
  const links = tree.links(nodes);

  // compute some boundaries
  const leafNode = maxBy(nodes, (o) => { return Number(o.depth); });
  const rightMostNode = maxBy(nodes, (o) => { return Number(o.x); });
  const leftMostNode = minBy(nodes, (o) => { return Number(o.x); });

  debug('stats', { leafNode, rightMostNode, leftMostNode });

  const xDelta = leftMostNode.x;
  const height = leafNode.y + leafNode.y_size;
  const width = rightMostNode.x + rightMostNode.x_size - leftMostNode.x + 30 + 26;

  // Compute current, previous and total execution times of all stages
  const totalExecTimeMS = computeExecTimes(nodes[0]);

  // Some post-processing applied to all nodes
  forEach(nodes, (d, i) => {
    // Set total exec time for all nodes
    d.totalExecTimeMS = totalExecTimeMS;
    // Align left most node to the left edge
    d.x += -xDelta;
    // Set the id here, so that already existing stage models can be merged
    d.key = format('stage-%d', i);
  });

  const newState = { nodes, links, width, height };

  debug('ExplainTreeStages state changed from', state, 'to', newState);

  return newState;
};

/**
 * To not have a huge switch statement in the reducer.
 */
const MAPPINGS = {
  [TREE_STAGES_CHANGED]: changeTreeStages
};

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];

  return fn ? fn(state, action) : state;
}

/**
* Action creator for the tree stages changed events.
*
* @param {Object} explain - The explain plan.
*
* @returns {Object} The explain plan fetched action.
*/
export const treeStagesChanged = (explain) => ({
  type: TREE_STAGES_CHANGED,
  explain
});
