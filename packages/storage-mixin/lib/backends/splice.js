var _ = require('lodash');
var async = require('async');
var BaseBackend = require('./base');
var LocalBackend = require('./local');
var SecureBackend = require('./secure');
var createErrback = require('./create-errback');
var inherits = require('util').inherits;

var debug = require('debug')('storage-mixin:backends:splice');

function SpliceBackend(options) {
  if (!(this instanceof SpliceBackend)) {
    return new SpliceBackend(options);
  }

  options = _.defaults(options, {
    filter: function(val, key) {
      return key.match(/warp/) ? 'secure' : 'local';
    }
  });

  this.namespace = options.namespace;
  this.filter = options.filter;
  this.localBackend = new LocalBackend(_.omit(options, 'filter'));
  this.secureBackend = new SecureBackend(_.omit(options, 'filter'));
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
  var tasks = _.map(this.backends, function(backend) {
    return backend.clear.bind(null, namespace);
  });
  async.parallel(tasks, done);
};

SpliceBackend.prototype.exec = function(method, model, options) {
  var self = this;
  var cb = createErrback(method, model, options);
  var tasks;

  var wrapCallback = function(done) {
    return {
      success: function(res) {
        done(null, res);
      },
      error: function(res, err) {
        done(err);
      }
    };
  };

  if (method === 'read') {
    tasks = [
      function(done) {
        self.localBackend.exec('read', model, wrapCallback(done));
      },
      function(done) {
        self.secureBackend.exec('read', model, wrapCallback(done));
      }
    ];
    async.parallel(tasks, function(err, res) {
      if (err) {
        return cb(err);
      }
      // merge results together
      if (model.isCollection) {
        _.each(_.zip(res[0], res[1]), function(pairs) {
          _.assign(pairs[0], pairs[1]);
        });
      } else {
        _.assign(res[0], res[1]);
      }
      return cb(null, res[0]);
    });
  }

  var serialized = model.serialize();
  var models = _.mapValues({'local': 1, 'secure': 1}, function(v, backend) {
    var keys = _.chain(serialized)
      .keys()
      .filter(function(key) {
        var value = serialized[key];
        return self.filter(value, key) === backend;
      })
      .value();
    return _.pick(serialized, keys);
  });
  debug('spliced models', models);
  tasks = [
    function(done) {
      self.localBackend.exec(method, models.local, wrapCallback(done));
    },
    function(done) {
      self.secureBackend.exec(method, models.secure, wrapCallback(done));
    }
  ];
  async.parallel(tasks, cb);
};

module.exports = SpliceBackend;
