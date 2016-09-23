const Reflux = require('reflux');

const ExplainActions = Reflux.createActions([
  /**
   * Explain actions
   */
  'switchToTreeView',
  'switchToJSONView',
  'fetchExplainPlan'
]);

module.exports = ExplainActions;
