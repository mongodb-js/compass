/**
 * Protects a route from being accessed without an active and well-formed
 * access token.
 */

var boom = require('boom'),
  brain = require('../../../scout-brain'),
  debug = require('debug')('scout-server:middleware:token_required');

module.exports = function(req, res, next) {
  var access_token;
  var auth = req.headers.authorization || '';
  var parts = auth.split(' ');

  debug('getting token from headers');
  if (!auth) return next(boom.forbidden('Missing authorization header'));

  access_token = parts[1];

  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return next(boom.badRequest('Authorization header malformed.'));
  }

  if (access_token === 'undefined') {
    return next(boom.badRequest('Access token is the string `undefined`'));
  }

  if (req.params.instance_id) {
    req.instance_id = req.params.instance_id;
  }

  debug('loading token');

  brain.loadToken(access_token, req, function(err){
    if(err){
      debug('error loading token:', err.message);
      return next(err);
    }

    debug('token loaded', req.url, req.method);
    next();
  });
};
