const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const ExplainStore = require('./index');
const _ = require('lodash');
const d3 = require('d3');
const format = require('util').format;
const constants = require('../constants');
const debug = require('debug')('mongodb-compass:stores:explain-tree-stages');

// this plugin allows for tree layout of variable-sized nodes
window.d3 = global.d3 = d3;
require('d3-flextree/dist/d3-flextree.js');

/**
 * Compass Explain store.
 */
const CompassExplainStore = Reflux.createStore({

  mixins: [StateMixin.store],

  /**
   * start listening to the ExplainStore for any changes.
   */
  init() {
    this.listenTo(ExplainStore, this.explainStoreUpdated);
  },

  _reset() {
    this.setState(this.getInitialState());
  },

  /**
   * Callback for when the ExplainStore has changed. Transforms `rawExplainObject`
   * into `nodes` and `links` arrays suitable for the TreeView.
   *
   * @param {Object} store     the state of the ExplainStore
   */
  explainStoreUpdated(store) {
    if (!_.has(store.rawExplainObject, 'executionStats.executionStages')) {
      this._reset();
      return;
    }

    const parsedExplain = this._parseExplain(
      store.rawExplainObject.executionStats.executionStages);

    const tree = d3.layout.flextree()
      .setNodeSizes(true)
      .nodeSize((d) => {
        let height = d.isShard ? constants.SHARD_CARD_HEIGHT : constants.DEFAULT_CARD_HEIGHT +
          (_.keys(d.highlights).length * constants.HIGHLIGHT_FIELD_HEIGHT);
        height += constants.VERTICAL_PADDING;
        return [constants.DEFAULT_CARD_WIDTH, height];
      })
      .spacing(function separation(a, b) {
        return a.parent === b.parent ? 20 : 50;
      });
    // compute nodes and links
    const nodes = tree.nodes(parsedExplain);
    const links = tree.links(nodes);

    // compute some boundaries
    const leafNode = _.max(nodes, 'depth');
    const rightMostNode = _.max(nodes, 'x');
    const leftMostNode = _.min(nodes, 'x');

    debug('stats', {
      leafNode: leafNode,
      rightMostNode: rightMostNode,
      leftMostNode: leftMostNode
    });

    const xDelta = leftMostNode.x;
    const height = leafNode.y + leafNode.y_size;
    const width = rightMostNode.x + rightMostNode.x_size - leftMostNode.x + 30 + 26;

    // compute current, previous and total execution times of all stages
    const totalExecTimeMS = this._computeExecTimes(nodes[0]);

    // some post-processing applied to all nodes
    _.forEach(nodes, (d, i) => {
      // set total exec time for all nodes
      d.totalExecTimeMS = totalExecTimeMS;
      // align left most node to the left edge
      d.x += -xDelta;
      // set the id here, so that already existing stage models can be merged
      d.key = format('stage-%d', i);
    });

    this.setState({
      nodes: nodes,
      links: links,
      width: width,
      height: height
    });
  },

  /**
   * Helper method to parse the explain output. Recursively applied to all
   * stages of the explain tree.
   *
   * @param {Object} parent   the parent stage, or undefined for the root stage
   * @param {Object} obj      the (nested) object of the raw explain output
   *                          that is currently being processed.
   *
   * @return {Object}         root stage with nested `children` array.
   */
  _parseExplain(parent, obj) {
    if (obj === undefined) {
      obj = parent;
      parent = undefined;
    }

    const stage = {
      name: obj.stage || obj.shardName,
      nReturned: obj.nReturned,
      curStageExecTimeMS: obj.executionTimeMillisEstimate !== undefined ?
        obj.executionTimeMillisEstimate : obj.executionTimeMillis,
      details: _.omit(obj, ['inputStage', 'inputStages', 'shards', 'executionStages']),
      x: obj.x,
      y: obj.y,
      depth: obj.depth,
      isShard: !!obj.shardName,
      parent: parent
    };

    // extract highlights relevant for the current stage from details
    stage.highlights = this._extractHighlights(stage);

    // recursively parse child or children of this stage
    const children = obj.inputStage || obj.inputStages ||
      obj.shards || obj.executionStages;

    if (_.isArray(children)) {
      stage.children = _.map(children, this._parseExplain.bind(this, stage));
    } else if (_.isPlainObject(children)) {
      stage.children = [ this._parseExplain(stage, children) ];
    } else {
      stage.children = [];
    }

    return stage;
  },

  /**
   * Helper function to extract highlight values out of a stage. For example,
   * the IXSCAN stage has the fields "Index Name" and "Multi Key Index"
   * highlighted above the "Details" section.
   *
   * @param {Object} stage    current stage to extract highlights from
   *
   * @return {Object}         Object, where key is the highlight name and
   *                          value is the matching value.
   */
  _extractHighlights(stage) {
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
  },

  /**
   * Helper method to recursively compute previous and current execution
   * times for each stage of the explain tree. Applied to the output of
   * _parseExplain().
   *
   * @param  {Object} node    The current node to process
   * @return {Number}         The execution time for the current node
   */
  _computeExecTimes: function(node) {
    if (!node.children || node.children.length === 0) {
      // leaf nodes
      node.prevStageExecTimeMS = 0;
    } else {
      const execTimes = _.map(node.children, this._computeExecTimes.bind(this));
      node.prevStageExecTimeMS = _.max(execTimes);
    }
    if (node.isShard) {
      node.curStageExecTimeMS = node.prevStageExecTimeMS;
    }
    // never return negative values
    node.curStageExecTimeMS = Math.max(0, node.curStageExecTimeMS);
    return node.curStageExecTimeMS;
  },


  /**
   * Initialize the Explain store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      nodes: [],
      links: [],
      width: 0,
      height: 0
    };
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('ExplainTreeStages store changed from', prevState, 'to', this.state);
  }
});

module.exports = CompassExplainStore;
