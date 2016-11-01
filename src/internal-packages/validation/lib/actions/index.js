const Reflux = require('reflux');

const ValidationActions = Reflux.createActions([
  /**
   * define your actions as strings below, for example:
   */
  'fetchValidationRules',
  'addValidationRule',
  'deleteValidationRule',
  'setRuleField',
  'setRuleCategory',
  'setRuleParameters',
  'setRuleNullable',
  'setValidationLevel',
  'setValidationAction',
  'setValidatorDocument',
  'switchView',
  'saveChanges',
  'cancelChanges'
]);

module.exports = ValidationActions;
