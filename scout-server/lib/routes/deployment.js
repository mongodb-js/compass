/**
 * @todo: Make `/deployment/watch` that uses replication helpers still in
 *   scope to emit events when the state of any instance in the
 *   deployment changes.
 */
var boom = require('boom'),
  models = require('../models');

module.exports = {
  list: function(req, res) {
    models.deployments.fetch(function(err, deployments) {
      res.send(deployments.map(function(deployment) {
        return deployment.toJSON();
      }));
    });
  },
  get: function(req, res, next) {
    if (!req.deployment) {
      return next(boom.notFound('Unknown deployment: ' + req.param('deployment_id')));
    }

    res.send(req.deployment.toJSON());
  }
};
