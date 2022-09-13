var _ = require('lodash');
var async = require('async');
var BaseBackend = require('./base');
var DiskBackend = require('./disk');
var NullBackend = require('./null');
var SecureBackend = require('./secure');
var wrapOptions = require('./errback').wrapOptions;
var wrapErrback = require('./errback').wrapErrback;
var inherits = require('util').inherits;
var assert = require('assert');
var TestBackend = require('./test');

var debug = require('debug')('mongodb-storage-mixin:backends:splice-disk');

function SpliceDiskBackend(options) {
  // replace with tests backend
  if (process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST === 'true') {
    return new TestBackend(options);
  }

  if (!(this instanceof SpliceDiskBackend)) {
    return new SpliceDiskBackend(options);
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
  this.diskBackend = new DiskBackend(options);
  this.diskBackend.serialize = function(model) {
    debug('Serializing for disk backend with condition', condition);
    return _.omitBy(model.serialize(), condition);
  };

  this.secureBackend = new SecureBackend(options);
  this.secureBackend.serialize = function(model) {
    debug('Serializing for secure backend with condition', condition);
    return _.pickBy(model.serialize(), condition);
  };
}

inherits(SpliceDiskBackend, BaseBackend);

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
SpliceDiskBackend.clear = function(namespace, done) {
  debug('Clear for all involved backends');
  var tasks = [
    DiskBackend.clear.bind(null, namespace),
    SecureBackend.clear.bind(null, namespace) // note: this is a no-op
  ];
  async.parallel(tasks, done);
};

SpliceDiskBackend.prototype.exec = function(method, model, options, done) {
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
      self.secureBackend.exec(
        method,
        model,
        wrapErrback(function(err, res) {
          if (err) {
            return cb(err);
          }
          if (
            model.isCollection &&
            !(self.secureBackend instanceof NullBackend)
          ) {
            // INT-961: better check here that we merge the right objects together
            _.each(diskRes, function(m, i) {
              assert.equal(m[model.mainIndex], res[i][model.mainIndex]);
            });
          }
          // once `secure` returned its result, we merge it with `disks`'s result
          cb(null, _.merge(diskRes, res));
        })
      );
    }
  ];
  async.waterfall(tasks, done);
};

module.exports = SpliceDiskBackend;
