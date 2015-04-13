/**
 * ### `:ns`
 *
 * Validates and unpacks any namespace string's `:ns` in a URL using
 * `database_name` and `collection_name` below to provide even more
 * validation and autoloading from the driver.
 */
var types = require('../models').types;

module.exports = function unpack_param_ns(req, res, next, raw) {
  req.ns = types.ns(raw);
  req.params.database_name = req.ns.database;
  req.params.collection_name = req.ns.collection;
  next();
};
