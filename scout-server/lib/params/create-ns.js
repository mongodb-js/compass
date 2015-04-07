/**
 * ### `:create_ns`
 *
 * In some cases we want to use a namespace string, but only really
 * the database side like when creating a new collection.
 */
var boom = require('boom');
var validate = require('../validate');
var types = require('../models').types;
var database_name = require('./database-name');

module.exports = function unpack_param_create_ns(req, res, next, raw) {
  req.ns = types.ns(raw);
  database_name(req, res, function(err) {
    if (err) return next(err);

    validate(req.ns.collection, 'collection_name', function(err) {
      if (err) return next(boom.badRequest('Invalid collection name'));
      req.params.name = req.ns.collection;
      next();
    });
  }, req.ns.database);
};
