/**
 * @todo: Add `/databases/watch` that polls and emits events when
 *  databases are created, removed, or updated.
 */

var boom = require('boom'),
  async = require('async'),
  types = require('../models').types,
  debug = require('debug')('scout-server:routes:database');

function getCollectionNames(req, fn) {
  req.db.collection('system.namespaces').find({}).toArray(function(err, data) {
    if (err) return fn(err);

    if (!data) {
      return fn(boom.notAuthorized('not authorized to view collections for this database'));
    }

    debug('find(system.namespaces) returned', err, data);

    var names = data.filter(function(ns) {
      return !(ns.name.indexOf('$') >= 0 && ns.name.indexOf('.oplog.$') < 0);
    })
    .map(function(ns) {
      return types.ns(ns.name).collection;
    });
    fn(null, names);
  });
}

function getCollections(req, fn) {
  getCollectionNames(req, function(err, names) {
    if (err) return fn(err);

    async.parallel(names.map(function(name) {
      return function(cb) {
        req.db.command({
          collStats: name,
          verbose: 1
        }, {}, function(err, data) {
          if (err) return cb(err);

          cb(null, {
            ns: req.db.name + '.' + name,
            name: name,
            database: req.db.name,
            is_capped: data.capped,
            max: data.max,
            is_power_of_two: data.userFlags === 1,
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
          });
        });
      };
    }), fn);
  });
}

function getDatabaseStats(req, fn) {
  req.db.command({
    dbStats: 1
  }, {}, function(err, data) {
    if (err) return fn(err);
    if (!data) {
      return fn(boom.notAuthorized('not authorized to view stats for this database'));
    }

    var stats = {
      document_count: data.objects,
      document_size: data.dataSize,
      storage_size: data.storageSize,
      index_count: data.indexes,
      index_size: data.indexSize,
      extent_count: data.numExtents,
      file_size: data.fileSize,
      ns_size: data.nsSizeMB * 1024 * 1024
    };
    fn(null, stats);
  });
}

module.exports = {
  get: function get(req, res, next) {
    async.parallel({
      stats: getDatabaseStats.bind(null, req),
      collections: getCollections.bind(null, req),
    }, function(err, d) {
      if (err) return next(err);

      res.send({
        _id: req.db.ns,
        name: req.db.name,
        stats: d.stats,
        collections: req.db.collections
      });
    });
  },
  post: function(req, res) {
    var doc = {
      name: req.param('database_name'),
      collections: []
    };
    req.mongo.db(req.param('database_name'));
    res.send(201, doc);
  },

  destroy: function(req, res, next) {
    req.db.dropDatabase(function(err) {
      if (err) return next(err);
      res.send(200, {
        name: req.db.name
      });
    });
  }
};
