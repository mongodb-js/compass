/**
 * ### `:ns`
 *
 * Validates and unpacks any namespace string's `:ns` in a URL using
 * `database_name` and `collection_name` below to provide even more
 * validation and autoloading from the driver.
 */
var types = require('../models').types;
var database_name = require('./database-name');
var collection_name = require('./collection-name');

module.exports = function unpack_param_ns(req, res, next, raw) {
  req.ns = types.ns(raw);

  database_name(req, res, function(err) {
    if (err) return next(err);

    collection_name(req, res, function(err) {
      if (err) return next(err);
      next();

    }, req.ns.collection);
  }, req.ns.database);
};
