var _ = require('lodash');
var async = require('async');
var BaseBackend = require('./base');
var LocalBackend = require('./local');
var SecureBackend = require('./secure');
var wrapOptions = require('./errback').wrapOptions;
var wrapErrback = require('./errback').wrapErrback;
var inherits = require('util').inherits;

// var debug = require('debug')('storage-mixin:backends:splice');

function SpliceBackend(options) {
  if (!(this instanceof SpliceBackend)) {
    return new SpliceBackend(options);
  }

  options = _.defaults(options, {
    secureCondition: function(val, key) {
      return key.match(/password/);
    }
  });

  this.namespace = options.namespace;

  // patch the serialize methods in both backends
  var condition = options.secureCondition;
  LocalBackend.prototype.serialize = function(model) {
    var res = _.omit(model.serialize(), condition);
    return res;
  };
  this.localBackend = new LocalBackend(options);

  SecureBackend.prototype.serialize = function(model) {
    var res = _.pick(model.serialize(), condition);
    return res;
  };
  this.secureBackend = new SecureBackend(options);
}

inherits(SpliceBackend, BaseBackend);

/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} namespace
 * @param {Function} done
 */
SpliceBackend.clear = function(namespace, done) {
  // call clear for all involved backends
  var tasks = [
    LocalBackend.clear.bind(null, namespace),
    SecureBackend.clear.bind(null, namespace)  // note: this is a no-op
  ];
  async.parallel(tasks, done);
};

SpliceBackend.prototype.exec = function(method, model, options, done) {
  var self = this;
  done = done || wrapOptions(method, model, options);

  var tasks = [
    function(cb) {
      self.localBackend.exec(method, model, wrapErrback(cb));
    },
    function(cb) {
      self.secureBackend.exec(method, model, wrapErrback(cb));
    }
  ];

  async.parallel(tasks, function(err, res) {
    if (method === 'read') {
      // merge the two results together
      if (err) {
        return done(err);
      }
      if (model.isCollection) {
        _.each(_.zip(res[0], res[1]), function(pairs) {
          _.assign(pairs[0], pairs[1]);
        });
      } else {
        _.assign(res[0], res[1]);
      }
    }
    done(null, res[0]);
  });
};

module.exports = SpliceBackend;
