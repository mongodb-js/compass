/**
 * @todo should most of this live in `scout-brain`?
 */
var debug = require('debug')('scout-server:routes:collection'),
  createReservoir = require('reservoir-stream'),
  validate = require('../validate'),
  boom = require('boom'),
  _ = require('underscore'),
  es = require('event-stream'),
  async = require('async');

/**
 * `collection.find()` and `collection.count()` are so similar in their
 * implementations that we can jam everything into one source function inside a
 * wrapper which will generate a new closure for the route handler.
 *
 * @param {Enum(count, find)} method
 * @api private
 */
function createReader(method) {
  return function(req, res, next) {
    var explain = req.boolean('explain');
    var cursor = req.db.collection(req.ns.collection)
    .find(req.json('query', '{}'), {
      fields: req.json('fields'),
      options: req.json('options'),
      limit: Math.min(200, req.int('limit', 10)),
      skip: Math.max(0, req.int('skip')),
      sort: req.json('sort'),
      explain: explain
    });

    if (explain) {
      return cursor.explain(function(err, data) {
        if (err) return next(err);
        res.send(data);
      });
    }

    if (method === 'count') {
      return cursor.count(function(err, data) {
        if (err) return next(err);
        res.send({
          count: data
        });
      });
    }

    // @todo: Hook back up to event-stream and socket.io.
    cursor.cursor.stream().pipe(res);
  };
}

/**
 * Take an `_id` and emit the source document.
 *
 * @param {mongodb.Db} db
 * @param {String} collection_name to source from.
 * @option {Object} query to refine possible samples [default: `{}`].
 * @option {Number} size of the sample to capture [default: `5`].
 * @returns {stream.Readable}
 * @api private
 */
function createSampleStream(db, collection_name, opts) {
  opts = _.default((opts || {}), {
    query: {},
    size: 5
  });

  var collection = db.collection(collection_name),
    src,
    cursor,
    reservoir;

  return es.readable(function(count, done) {
    if (src) return;

    var self = this;

    src = collection.find(opts.query, {
      fields: {
        _id: 1
      }
    });

    cursor = src.cursor.stream()
    .on('error', self.emit.bind(self, 'error'));

    reservoir = createReservoir(opts.size)
    .on('error', self.emit.bind(self, 'error'))
    .on('data', function(doc) {
      self.emit('data', doc._id);
    })
    .on('end', function() {
      done();
    });
  });
}

/**
 * Take an `_id` and emit the source document.
 *
 * @param {mongodb.Db} db
 * @param {String} collection_name to source from.
 * @option {Object} fields to return for each document [default: `null`].
 * @returns {stream.Transform}
 * @api private
 */
function _idToDocument(db, collection_name, opts) {
  opts = _.default((opts || {}), {
    fields: null
  });

  var collection = db.collection(collection_name);
  return es.map(function(_id, fn) {
    collection.findOne({
      _id: _id
    }, {
      fields: opts.fields
    }, fn);
  });
}

function getCollectionFeatures(req, fn) {
  if (req.collection_features) {
    return process.nextTick(function() {
      fn(null, req.collection_features);
    });
  }
  req.db.command({
    collStats: req.ns.collection
  }, {
    verbose: 1
  }, function(err, data) {
    if (err) return fn(err);

    req.collection_features = {
      capped: data.capped,
      max: data.max,
      size: data.size,
      power_of_two: data.userFlags === 1
    };
    fn(null, req.collection_features);
  });
}

function getCollectionStats(req, fn) {
  if (req.collection_stats) {
    return process.nextTick(function() {
      fn(null, req.collection_stats);
    });
  }
  req.db.command({
    collStats: req.ns.collection
  }, {
    verbose: 1
  }, function(err, data) {
    if (err) return fn(err);

    req.collection_stats = {
      index_sizes: data.indexSizes,
      document_count: data.count,
      document_size: data.size,
      storage_size: data.storageSize,
      index_count: data.nindexes,
      index_size: data.totalIndexSize,
      padding_factor: data.paddingFactor,
      extent_count: data.numExtents,
      extent_last_size: data.lastExtentSize,
      flags_user: data.userFlags,
      flags_system: data.systemFlags
    };
    fn(null, req.collection_stats);
  });
}

function getCollectionIndexes(req, fn) {
  req.db.collection('system.indexes')
  .find({
    ns: req.ns.toString()
  })
  .toArray(fn);
}

module.exports = {
  get: function(req, res, next) {
    var tasks = {
      indexes: getCollectionIndexes.bind(null, req),
      stats: getCollectionStats.bind(null, req),
      features: getCollectionFeatures.bind(null, req)
    };
    async.parallel(tasks, function(err, data) {
      if (err) return next(err);

      var model = _.extend(data.features, {
        _id: req.ns.toString(),
        name: req.ns.collection,
        database: req.ns.database,
        stats: data.stats,
        indexes: data.indexes
      });

      res.send(model);
    });
  },
  find: createReader('find'),
  count: createReader('count'),
  sample: function(req, res) {
    createSampleStream(req.db, req.ns.collection, {
      query: req.json('query'),
      size: req.int('size', 5)
    })
    .pipe(_idToDocument(req.db, req.ns.collection, {
      fields: req.json('fields')
    }))
    .pipe(res);
  },
  bulk: function(req, res, next) {
    if (!Array.isArray(req.body)) return next(boom.badRequest('Body should be an array'));

    var batch = req.col.initializeUnorderedBulkOp();
    req.body.map(batch.insert.bind(batch));
    batch.execute(function(err, result) {
      if (err) return next(err);

      var data = {
        processed_count: req.body.length,
        write_errors: result.writeErrors || [],
        write_concern_errors: result.writeConcernErrors || [],
        inserted_count: result.nInserted,
        upserted_count: result.nUpserted,
        matched_count: result.nMatched,
        modified_count: result.nModified,
        removed_count: result.nRemoved,
        upserted: result.upserted || []
      };
      res.send(data);
    });
  },
  distinct: function(req, res, next) {
    req.col.distinct(req.params.key, req.json('query', '{}'), function(err, docs) {
      if (err) return next(err);
      res.send(docs);
    });
  },

  aggregate: function(req, res, next) {
    var pipeline = req.json('pipeline'),
      opts = {
        explain: req.boolean('explain'),
        allowDiskUse: req.boolean('allowDiskUse'),
        cursor: req.json('cursor')
      };

    req.col.aggregate(pipeline, opts, function(err, docs) {
      if (err) return next(err);
      res.send(docs);
    });
  },

  plans: function(req, res, next) {
    var spec = {
      planCacheListPlans: req.ns.collection,
      query: req.json('query'),
      projection: req.json('sort'),
      sort: req.json('projection'),
    };

    if (!spec.query && !spec.sort && !spec.projection) {
      spec = {
        planCacheListQueryShapes: req.ns.collection
      };

      return req.db.command(spec, function(err, data) {
        if (err) return next(err);
        res.send(data.shapes);
      });
    }

    req.db.command(spec, function(err, data) {
      if (err) return next(err);
      res.send(data.shapes);
    });
  },
  destroy: function(req, res, next) {
    var name = req.params.collection_name;
    if (!name) {
      return next(boom.badRequest('Missing collection_name'));
    }
    validate(req.params.collection_name, 'collection_name', function(err, name) {
      if (err) return next(boom.badRequest('Invalid collection name'));

      req.mongo.db(req.params.database_name).dropCollection(name, function(err) {

        if (err){
          console.log('error removing', name);
          return next(err);
        }
        res.status(204).send();
      });
    });
  },
  post: function(req, res, next) {
    var opts = {
      capped: req.boolean('capped'),
      size: req.int('size'),
      max: req.int('max'),
      strict: true
    };

    if (opts.capped && !(opts.size || opts.max)) {
      return next(boom.badRequest('Capped collections require `size` or `max`'));
    }

    if (opts.capped && (opts.size && opts.max)) {
      return next(boom.badRequest('`size` and `max` are mutually exclusive'));
    }
    debug('creating new collection', req.params.collection_name, opts);
    validate(req.params.collection_name, 'collection_name', function(err, name) {

      if (err) return next(boom.badRequest('Invalid collection name'));
      req.mongo.db(req.params.database_name).createCollection(name, opts, function(err) {
        if (err) {
          if (/(target namespace exists|already exists)/.test(err.message)) {
            return next(boom.conflict('Collection already exists'));
          }
          return next(err);
        }
        opts.name = req.params.collection_name;
        opts.database = req.params.database_name;
        opts.ns = opts.database + '.' + opts.name;
        res.status(201).send(opts);
      });
    });
  },
  put: function(req, res, next) {
    if (!req.params.name) {
      return next(boom.badRequest('Missing required `name`'));
    }
    req.mongo.db(req.database_name).renameCollection(req.params.collection_name, req.params.name, function(err) {
      if (err) {
        if (/target namespace exists/.test(err.message)) {
          return next(boom.conflict('Cannot rename because `' + req.params.name + '` already exists'));
        }
        return next(err);
      }
      res.send({
        name: req.params.name,
        database: req.params.database_name,
        _id: req.params.database_name + '.' + req.params.name
      });
    });
  }
};
