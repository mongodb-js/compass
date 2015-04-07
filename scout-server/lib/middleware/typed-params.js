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

  res.json = function(obj) {
    if (!this.get('Content-Type')) {
      this.set('Content-Type', 'application/json');
    }
    try {
      return this.send(EJSON.stringify(obj, null, 2));
    } catch (e) {
      throw new Error('Tried sending unclean object that probably contains private info!\n' +
      'See https://github.com/10gen/mongoscope/issues/35');
    }
  };

  next();
};
