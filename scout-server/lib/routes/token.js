/**
 * @todo Docs.
 * @todo Still some decoupling to do here.  Now that this is all under control,
 *    `scout-brain` can get significantly easier.
 */
var boom = require('boom'),
  brain = require('../../../scout-brain'),
  debug = require('debug')('scout-server:routes:token');

function create(deployment, req, res, next) {
  debug('create');
  req.deployment = deployment;

  debug('create token');
  return brain.createToken(req, function(err, data) {
    if (err) return next(err);
    res.format({
      text: function() {
        res.status(201).send(data.token);
      },
      default: function() {
        res.status(201).send(data);
      }
    });
  });
}

module.exports = {
  destroy: function(req, res, next) {
    if (!req.session_id) {
      return next(new Error('No session_id make sure your middleware is configured.'));
    }
    debug('destroying ');

    brain.destroySession(req.session_id, function(err) {
      if (err) return next(err);
      res.status(200).send({
        success: true
      });
    });
  },
  post: function(req, res, next) {
    debug('being post handler');
    var url = req.body.seed, ctx;
    if (!url) return next(boom.badRequest('Missing required param `seed`'));

    ctx = {
      instance_id: brain.types.instance_id(url),
      seed: url
    };

    var opts = {
      timeout: req.int('timeout', 1000),
      auth: {}
    };

    if (req.body.mongodb_username) {
      opts.auth.mongodb = {
        username: req.body.mongodb_username,
        password: req.body.mongodb_password,
        authdb: req.body.mongodb_authdb || 'admin'
      };
      if (opts.auth.mongodb_password) {
        return next(boom.badRequest('Missing `mongodb_password` param'));
      }
    }
    if (req.params.ssh_key) {
      opts.auth.ssh = {
        username: req.params.ssh_username,
        key: req.params.ssh_key
      };
    }
    ctx.auth = opts.auth;

    debug('get deployment for `%s`', url);
    brain.getDeployment(url, opts, function(err, deployment) {
      if (err) return next(err);

      if (deployment) {
        return create(deployment, ctx, res, next);
      }

      brain.createDeployment(url, opts, function(err, deployment) {
        if (err) return next(err);

        return create(deployment, ctx, res, next);
      });
    });
  }
};
