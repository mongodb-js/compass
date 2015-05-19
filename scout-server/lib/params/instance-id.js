/**
 * A handler to validate any `:instance_id` values in a URL.
 */
var validate = require('../validate');
var types = require('../models').types;

module.exports = function unpack_param_instance_id(req, res, next, _id) {
  req.params.instance_id = types.instance_id(_id);
  validate.middleware('instance_id', 'id')(req, res, next, _id);
};
