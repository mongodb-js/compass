const Reflux = require('reflux');

const ExplainActions = Reflux.createActions([
  /**
   * Explain actions
   */
  'switchToTreeView',
  'switchToJSONView',
  'resetExplainPlan',
  'fetchExplainPlan'
]);

module.exports = ExplainActions;
