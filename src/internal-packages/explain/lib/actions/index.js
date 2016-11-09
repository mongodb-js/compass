const Reflux = require('reflux');

const ExplainActions = Reflux.createActions([
  /**
   * Explain actions
   */
  'switchToTreeView',
  'switchToJSONView',
  'initiateExplainPlan',
  'fetchExplainPlan'
]);

module.exports = ExplainActions;
