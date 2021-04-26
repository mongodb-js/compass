var _ = require('lodash');

var stageIterationMixin = {
  /**
   * creates an iterator object with a next() method. Each call to next()
   * will return the next stage in a depth first order, starting with the
   * root stage.
   *
   * @param  {[type]} root [description]
   * @return {[type]}      [description]
   */
  _getStageIterator: function(root) {
    var model = this;
    var stage;
    var stageStack;

    if (!root) {
      root = _.get(this.rawExplainObject, 'executionStats.executionStages');
    }

    if (this.initialized && root) {
      stageStack = [root];
    } else {
      stageStack = [];
    }
    var iterator = {
      current: function() {
        return stage;
      },
      next: function() {
        if (stageStack.length > 0) {
          stage = stageStack.pop();
          var children = model._getChildStages(stage);
          if (children) {
            // attach parent to each child and add to queue
            _.each(children, function(child) {
              child.parentName = stage.stage;
              stageStack.push(child);
            });
          }
          return stage;
        }
        return null;
      }
    };
    return iterator;
  },
  /**
   * returns child stage or stages of current stage as array. If there are
   * no more child stages, returns empty array []. Also works for sharded
   * explain plans (where shards are children). Not supported for legacy mode.
   *
   * @param  {Object} stage   - stage to get children of.
   * @return {Array}          - array of child stages.
   */
  _getChildStages: function(stage) {
    // not supported for legacy mode
    if (this.legacyMode) {
      return null;
    }
    stage = stage || _.get(this.rawExplainObject, 'executionStats.executionStages', {});
    var stages = [];
    if (stage.inputStage) {
      stages.push(stage.inputStage);
    }
    if (stage.executionStages) {
      stages.push(stage.executionStages);
    }
    if (stage.innerStage) {
      stages.push(stage.innerStage);
    }
    if (stage.outerStage) {
      stages.push(stage.outerStage);
    }
    if (stage.thenStage) {
      stages.push(stage.thenStage);
    }
    if (stage.elseStage) {
      stages.push(stage.elseStage);
    }
    if (stage.shards) {
      stages = stages.concat(stage.shards);
    }
    if (stage.inputStages) {
      stages = stages.concat(stage.inputStages);
    }
    return stages;
  },
  /**
   * iterates over all stages and returns a depth-first pre-ordered array
   * of all stages.
   *
   * @param  {Object} root  - root stage, or undefined to start at the root.
   * @return {Array}        - stages array
   */
  _getStageArray: function(root) {
    var result = [];
    var it = this._getStageIterator(root);
    for (var stage = it.next(); stage; stage = it.next()) {
      result.push(stage);
    }
    return result;
  }
};

module.exports = stageIterationMixin;
