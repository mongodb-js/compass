var each = require('lodash.foreach');

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
    root = root || this.rawExplainObject.executionStats.executionStages;
    var stage;
    var model = this;
    var stageStack = [root];
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
            each(children, function(child) {
              child.parent = stage;
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
   * Walks the tree of execution stages from a given node (or root) and returns
   * the first stage with the specified name, or null if no stage is found.
   * Equally-named children stage are traversed and returned in order.
   * Returns null if legacyMode is true.
   *
   * @param  {String} name   - name of stage to return
   * @param  {Object} root   - stage to start from. If unspecified, start from
   *                           executionStages root node.
   * @return {Object|null}   - stage object or null
   */
  _findStageByName: function(name, root) {
    // not supported for legacy mode
    if (this.legacyMode) {
      return null;
    }
    var it = this._getStageIterator(root);
    for (var stage = it.next(); stage !== null; stage = it.next()) {
      if (stage.stage === name) {
        return stage;
      }
    }
    return null;
  },
  /**
   * returns child stage or stages of current stage as array. If there are
   * no more child stages, returns empty array []. Not supported for legacy
   * mode.
   *
   * @param  {Object} stage   - stage to get children of.
   * @return {Array}          - array of child stages.
   */
  _getChildStages: function(stage) {
    // not supported for legacy mode
    if (this.legacyMode) {
      return null;
    }
    stage = stage || this.rawExplainObject.executionStats.executionStages;
    return stage.inputStage ? [stage.inputStage] : stage.inputStages;
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
    for (var stage = it.next(); stage !== null; stage = it.next()) {
      result.push(stage);
    }
    return result;
  }
};

module.exports = stageIterationMixin;
