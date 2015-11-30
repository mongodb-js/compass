var _ = require('lodash');
var async = require('async');
var BaseBackend = require('./base');
var LocalBackend = require('./local');
var SecureBackend = require('./secure');
var wrapOptions = require('./errback').wrapOptions;
var wrapErrback = require('./errback').wrapErrback;
var inherits = require('util').inherits;

var debug = require('debug')('storage-mixin:backends:splice');

/**
 * Helper function to patch the two backends' serialize() method.
 *
 * @param  {[type]} backend           instantiated backend, local or secure
 * @param  {[type]} secureCondition   filter function that returns true when
 *                                    the secure backend should be used, e.g.
 *                                    when a key contains the string `password`
 */
// function patchSerializeFn(backend, secureCondition) {
//   var fn = (backend instanceof SecureBackend) ? _.pick : _.omit;
//   backend.serialize = function(model) {
//     var ret = fn(model.serialize(), secureCondition);
//     return ret;
//   };
//   return backend;
// }


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

  // instantiate backends and patch serialize methods
  var condition = options.secureCondition;
  // this.localBackend = patchSerializeFn(new LocalBackend(options), condition);
  // this.secureBackend = patchSerializeFn(new SecureBackend(options), condition);

  // create derived backends
  LocalBackend.prototype.serialize = function(model) {
    var res = _.omit(model.serialize(), condition);
    debug('serialize', res);
    return res;
  };
  this.localBackend = new LocalBackend(options);

  SecureBackend.prototype.serialize = function(model) {
    var res = _.pick(model.serialize(), condition);
    debug('serialize', res);
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
    function(cb) {
      LocalBackend.clear.bind(null, namespace, cb);
    },
    function(cb) {
      SecureBackend.clear.bind(null, namespace, cb);
    }
  ];
  async.parallel(tasks, done);
};

SpliceBackend.prototype.exec = function(method, model, options, done) {
  var self = this;
  done = done || wrapOptions(method, model, options);

  var tasks = [
    function(cb) {
      debug('calling secure');
      self.secureBackend.exec(method, model, wrapErrback(cb));
    },
    function(cb) {
      debug('calling local');
      self.localBackend.exec(method, model, wrapErrback(cb));
    }
  ];

  async.parallel(tasks, function(err, res) {
    debug('async parallel method: %s', method, err, res);
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
    debug('res[0] after merge', res[0]);
    done(null, res[0]);
  });
};

module.exports = SpliceBackend;
