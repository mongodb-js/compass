var config = require('mongoscope-config'),
  jwt = require('jsonwebtoken'),
  boom = require('boom'),
  debug = require('debug')('scout-brain:token'),
  _ = require('underscore');

var getDeployment = require('./deployment').get;
var createSession = require('./session').create;
var getSession = require('./session').get;

function shorten(token) {
  return token.substr(0, 8) + '...';
}

function verify(token, fn) {
  debug('verifying `%s`', shorten(token));
  jwt.verify(token, config.get('token:secret').toString('utf-8'), function(err, data) {
    if (err) {
      debug('invalid token', err.message);
      return fn(boom.forbidden(err.message));
    }

    fn(null, data);
  });
}

module.exports.load = function(token, ctx, next) {
  debug('loading `%s`', shorten(token));
  verify(token, function(err, data) {
    if (err) return next(err);
    debug('verified data `%j`', data);

    if (!data.session_id) {
      return next(boom.badRequest('Bad token: missing session id'));
    }

    if (!data.deployment_id) {
      return next(boom.badRequest('Bad token: missing deployment_id'));
    }

    ctx.session_id = data.session_id;

    debug('token validated for deployment', data.deployment_id);

    getDeployment(data.deployment_id, function(err, deployment) {
      if (err) return next(err);
      if (!deployment) {
        return next(boom.badRequest('Bad token: deployment not found'));
      }

      ctx.deployment = deployment;
      if (ctx.instance_id) {
        debug('looking up instance `%s` from `%j`', ctx.instance_id, deployment.instances);

        ctx.instance = _.findWhere(deployment.instances, {
          _id: ctx.instance_id
        });

        if (!ctx.instance) {
          return next(boom.forbidden('Tried getting a connection ' +
          'to `' + ctx.instance_id + '` but it is not in ' +
          'deployment `' + data.deployment_id + '`'));
        }

        debug('getting connection for session', data.session_id);
        getSession(data.session_id, function(err, connection) {
          if (err) return next(err);

          ctx.mongo = connection;
          return next();
        });

      } else {
        getSession(data.session_id, function(err, connection) {
          if (err) return next(err);

          ctx.mongo = connection;
          return next();
        });
      }
    });
  });
};

// @todo: this should live in actions/token or session?
module.exports.create = function(ctx, fn) {
  // @todo: ctx.deployment should be an instance of `models.Deployment`

  // Connection options for MongoClient
  var connectionOpts = {
    auth: ctx.auth,
    timeout: ctx.timeout
  };

  createSession(ctx.seed, connectionOpts, function(err, session) {
    var payload = {
        deployment_id: ctx.deployment._id,
        session_id: undefined
      },
      opts = {
        expiresInMinutes: config.get('token:lifetime')
      },
      secret = config.get('token:secret').toString('utf-8'),
      now = Date.now();

    debug('creating token for `%j`', payload);
    if (err) return fn(err);
    payload.session_id = session._id;

    ctx.session_id = session._id;
    debug('add session_id to ctx');

    ctx.mongo = session.connection;
    debug('add connection to ctx');

    var token = jwt.sign(payload, secret, opts);
    var res = {
      session_id: session._id,
      token: token,
      deployment_type: ctx.deployment.type,
      deployment_id: ctx.deployment._id,
      instance_id: ctx.instance_id,
      id: ctx.session_id,
      expires_at: new Date(now + (config.get('token:lifetime') * 60 * 1000)),
      created_at: new Date(now)
    };

    debug('created `%s`', shorten(token));
    fn(null, res);
  });
};
