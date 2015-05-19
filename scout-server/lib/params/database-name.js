/**
 * Validates any database name in a URL and pins a database reference
 * on the request `req.db` from the driver.
 */
var boom = require('boom');
var validate = require('../validate');

module.exports = function unpack_param_database_name(req, res, next, name) {
  validate(name, 'database_name', function(err, value) {
    if (err) return next(boom.badRequest('Invalid database name `' + name + '`'));
    req.params.database_name = value;
    next();
  });
};
