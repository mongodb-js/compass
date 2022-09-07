var _ = require('lodash');
var async = require('async');
var BaseBackend = require('./base');
var DiskBackend = require('./disk');
var NullBackend = require('./null');
var SecureIpcBackend = require('./secure-ipc');
var wrapOptions = require('./errback').wrapOptions;
var wrapErrback = require('./errback').wrapErrback;
var mergeSpliceResults = require('./util').mergeSpliceResults;
var inherits = require('util').inherits;
var TestBackend = require('./test');

var debug = require('debug')('mongodb-storage-mixin:backends:splice-disk-ipc');

function SpliceDiskIpcBackend(options) {
  // replace with tests backend
  if (process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST === 'true') {
    return new TestBackend(options);
  }

  if (typeof window === 'undefined') {
    return NullBackend;
  }

  if (!(this instanceof SpliceDiskIpcBackend)) {
    return new SpliceDiskIpcBackend(options);
  }

  options = _.defaults(options, {
    appName: 'storage-mixin',
    secureCondition: function(val, key) {
      return key.match(/password/);
    }
  });

  this.namespace = options.namespace;

  // patch the serialize methods in both backends
  var condition = options.secureCondition;
  DiskBackend.prototype.serialize = function(model) {
    debug('Serializing for disk backend with condition', condition);
    var res = _.omitBy(model.serialize(), condition);
    return res;
  };
  this.diskBackend = new DiskBackend(options);

  SecureIpcBackend.prototype.serialize = function(model) {
    debug('Serializing for secure backend with condition', condition);
    var res = _.pickBy(model.serialize(), condition);
    return res;
  };
  this.secureBackend = new SecureIpcBackend(options);
}

inherits(SpliceDiskIpcBackend, BaseBackend);

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
SpliceDiskIpcBackend.clear = function(namespace, done) {
  debug('Clear for all involved backends');
  var tasks = [
    DiskBackend.clear.bind(null, namespace),
    SecureIpcBackend.clear.bind(null, namespace) // note: this is a no-op
  ];
  async.parallel(tasks, done);
};

SpliceDiskIpcBackend.prototype.exec = function(method, model, options, done) {
  var self = this;
  done = done || wrapOptions(method, model, options);

  var tasks = [
    function(cb) {
      self.diskBackend.exec(method, model, wrapErrback(cb));
    },
    function(diskRes, cb) {
      // after receiving the result from `disk`, we set it on the the
      // model/collection here so that `secure` knows the ids.
      model.set(diskRes, { silent: true, sort: false });
      // There will be no disk result on update or create.
      self.secureBackend.exec(
        method,
        model,
        wrapErrback(function(err, res) {
          if (err) {
            return cb(err);
          }
          if (!_.isEmpty(diskRes)) {
            mergeSpliceResults(diskRes, res, model, cb);
          } else {
            return cb(null, model.isCollection ? [] : {});
          }
        })
      );
    }
  ];
  async.waterfall(tasks, done);
};

module.exports = SpliceDiskIpcBackend;
