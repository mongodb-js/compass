var inherits = require('util').inherits;
var BaseBackend = require('./base');
var fs = require('fs');
var writeFileAtomic = require('write-file-atomic');
var path = require('path');
var async = require('async');
var _ = require('lodash');
var rimraf = require('rimraf');

var debug = require('debug')('storage-mixin:backends:disk');

/**
 * Match a UUID.
 */
var JSON_REGEX = /.json$/gi;

if (_.isEmpty(fs)) {
  /**
   * looks like we're in a browser context. check if we can use electron's
   * remote module to access fs.
   */
  try {
    /* eslint no-undef: 0 */
    fs = require('@electron/remote').require('fs');
  } catch (e) {
    // not possible, throw error
    throw new Error('browser context, `fs` module not available for disk storage');
  }
}

function DiskBackend(options) {
  if (!(this instanceof DiskBackend)) {
    return new DiskBackend(options);
  }

  options = _.defaults(options, {
    basepath: '.'
  });

  this.basepath = options.basepath;
  this.namespace = options.namespace;

  // create path synchronously so we can use the model right away
  try {
    /* eslint no-sync: 0 */
    fs.mkdirSync(this._getPath());
  } catch (e) {
    // ignore error
  }
}
inherits(DiskBackend, BaseBackend);


/**
 * Clear the entire namespace. Use with caution!
 *
 * @param {String} basepath
 * @param {String} namespace
 * @param {Function} done
 */
DiskBackend.clear = function(basepath, namespace, done) {
  if (done === undefined) {
    done = namespace;
    namespace = '.';
  }
  rimraf(path.join(basepath, namespace), done);
};

DiskBackend.prototype._getPath = function() {
  return path.join(
    process.env.MONGODB_COMPASS_STORAGE_MIXIN_TEST_BASE_PATH || this.basepath,
    this.namespace
  );
};

DiskBackend.prototype._getId = function(modelOrFilename) {
  var id = (typeof modelOrFilename === 'string') ?
    modelOrFilename : modelOrFilename.getId();
  return path.join(this._getPath(), id + '.json');
};

/**
 * The `disk` layer doesn't support atomic updates
 * so `update` and `create` are the same under the hood.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 * @api private
 */
DiskBackend.prototype._write = function(model, options, done) {
  var file = this._getId(model);
  debug('_write', file);
  writeFileAtomic(file, JSON.stringify(this.serialize(model)), done);
};

/**
 * Delete a model on disk.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-destroy
 */
DiskBackend.prototype.remove = function(model, options, done) {
  var file = this._getId(model);
  fs.exists(file, function(exists) {
    if (!exists) {
      debug('remove: skipping', file, 'not exists');
      return done(); // just ignore if the file isn't there
    }

    debug('remove: unlinking', file);
    fs.unlink(file, done);
  });
};

/**
 * Point `update` interface method at our `_write` method.
 */
DiskBackend.prototype.update = DiskBackend.prototype._write;

/**
 * Point `create` interface method at our `_write` method.
 */
DiskBackend.prototype.create = DiskBackend.prototype._write;

/**
 * Load a model from disk.
 *
 * @param {ampersand-model} model
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-model-fetch
 */
DiskBackend.prototype.findOne = function(model, options, done) {
  var file = this._getId(model);
  fs.exists(file, function(exists) {
    if (!exists) {
      return done(null, {});
    }
    fs.readFile(file, 'utf8', function(err, content) {
      if (err) {
        return done(err);
      }
      try {
        var parsed = JSON.parse(content);
        done(null, parsed);
      } catch (e) {
        done(e);
      }
    });
  });
};

/**
 * Fetch all keys stored under the active namespace.
 *
 * @param {ampersand-collection} collection
 * @param {Object} options
 * @param {Function} done
 *
 * @see http://ampersandjs.com/docs#ampersand-collection-fetch
 */
DiskBackend.prototype.find = function(collection, options, done) {
  var self = this;

  fs.readdir(this._getPath(), function(err, files) {
    if (err) {
      return done(err);
    }

    if (files.length === 0) {
      debug('no keys found for namespace `%s`', self.namespace);
      return done(null, []);
    }

    var filtered = files.filter(function(file) {
      return file.match(JSON_REGEX);
    });
    var tasks = filtered.map(function(file) {
      return self.findOne.bind(self,
        path.basename(file, path.extname(file)), options);
    });

    debug('fetching %d models', tasks.length);
    async.parallel(tasks, done);
  });
};

module.exports = DiskBackend;
