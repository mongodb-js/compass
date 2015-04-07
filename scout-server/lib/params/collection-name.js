/**
 * Validates any collection name in a URL and pins a collection reference
 * on the request `req.col` from the driver.
 */
var boom = require('boom');
var validate = require('../validate');

module.exports = function unpack_param_collection_name(req, res, next, name) {
  validate(name, 'collection_name', function(err, value) {
    if (err) return next(boom.badRequest('Invalid collection name'));

    req.db.collection(value, {
      strict: true
    }, function(err, col) {
      if (err) return next(err);
      req.col = col;
      req.col.name = value;
      next();
    });
  });
};
