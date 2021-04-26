var Model = require('./model');
var LegacyModel = require('./legacy-model');

/**
 * Returns a model for current (3.0+) or legacy (2.6) explain plans.
 *
 * @param {object} explain     the raw explain plan output as object
 * @return {Model}             the matching model
 */
function ExplainPlanModel(explain) {
  if (!explain) {
    return new Model();
  }
  if (explain.cursor || explain.clusteredType) {
    return new LegacyModel(explain, {parse: true});
  }
  return new Model(explain, {parse: true});
}

module.exports = ExplainPlanModel;
