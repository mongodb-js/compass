/**
 * Adds extra getters to `req` that are type aware.
 */
var EJSON = require('mongodb-extended-json');

module.exports = function(req, res, next) {
  req.json = function(key, _default) {
    _default = _default || 'null';
    return EJSON.parse((req.params[key] || _default));
  };

  req.int = function(key, _default) {
    _default = _default || 0;
    return parseInt((req.params.key || _default), 10);
  };

  req.boolean = function(key, _default) {
    return (req.int(key, _default) === 1);
  };
  next();
};
