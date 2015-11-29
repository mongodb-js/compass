var ampersandSync = require('ampersand-sync');
var _ = require('lodash');
var BaseBackend = require('./base');
var inherits = require('util').inherits;

function RemoteBackend(options) {
  if (!(this instanceof RemoteBackend)) {
    return new RemoteBackend(options);
  }
  this.namespace = options.namespace;
  this.options = _.omit(options, ['namespace', 'backend']);
}
inherits(RemoteBackend, BaseBackend);

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
RemoteBackend.clear = function(namespace, done) {
  // nothing to clean up here
  done();
};

RemoteBackend.prototype.exec = function(method, model, options) {
  // merge global options into local ones if not set
  _.defaults(options, this.options);
  ampersandSync(method, model, options);
};

module.exports = RemoteBackend;
