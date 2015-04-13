/**
 * @todo docs.
 * @todo should most of this live in `scout-brain`?
 */
var boom = require('boom'),
  async = require('async'),
  models = require('../models'),
  types = models.types,
  _ = require('underscore');

module.exports = {
  get: function(req, res, next) {
    models.instances.findOne({
      _id: req.deployment_id,
      // instance_id: req.instance_id
    }, function(err, model) {
      if (err) return next(err);

      getInstanceDetail(req, function(err, detail) {
        res.send(_.extend(model, detail));
      });
    });
  }
};

function getInstanceDetail(req, fn) {
  var tasks = {
    databases: getAllDatabases.bind(null, req),
    collections: getAllCollections.bind(null, req),
    host: getHost.bind(null, req),
    build: getBuild.bind(null, req)
  };
  async.parallel(tasks, function(err, data) {
    if (err) return fn(err);

    rollupAllDatabaseStats(data.databases, function(err, stats) {
      if (err) return fn(err);

      data.stats = stats;
      fn(null, data);

    });
  });
}

function getAllDatabaseNames(req, fn) {
  if (req.database_names) {
    return process.nextTick(function() {
      fn(null, req.database_names);
    });
  }
  req.mongo.admin().listDatabases(function(err, data) {
    if (err) return fn(err);

    req.database_names = data.databases.filter(function(db) {
      return !db.empty;
    }).map(function(db) {
      return db.name;
    });
    fn(null, req.database_names);
  });
}

function getAllCollections(req, fn) {
  getAllDatabaseNames(req, function(err, names) {
    if (err) return fn(err);
    var tasks = names.map(function(name) {
      return function(cb) {
        req.mongo.db(name)
        .collection('system.namespaces')
        .find()
        .toArray(function(err, data) {
          if (err) return fn(err);

          var names = data.filter(function(ns) {
            return !(ns.name.indexOf('$') >= 0 && ns.name.indexOf('.oplog.$') < 0);
          }).map(function(doc) {
            var ns = types.ns(doc.name);
            return {
              _id: ns.toString(),
              name: ns.collection,
              database: ns.database
            };
          });
          cb(null, names);
        });
      };
    });

    async.parallel(tasks, fn);
  });
}

function getAllDatabases(req, fn) {
  getAllDatabaseNames(req, function(err, names) {
    if (err) return fn(err);

    var tasks = names.map(function(name) {
      return function(cb) {
        req.mongo.db(name).command({
          dbStats: 1
        }, {}, function(err, data) {
          if (err) return cb(err);

          cb(null, {
            _id: name,
            name: name,
            document_count: data.objects,
            document_size: data.dataSize,
            storage_size: data.storageSize,
            index_count: data.indexes,
            index_size: data.indexSize,
            extent_count: data.numExtents,
            file_size: data.fileSize,
            ns_size: data.nsSizeMB * 1024 * 1024,
            collections: []
          });
        });
      };
    });
    async.parallel(tasks, fn);
  });
}

function rollupAllDatabaseStats(databases, fn) {
  var keys = [
    'document_count',
    'document_size',
    'storage_size',
    'index_count',
    'index_size',
    'extent_count',
    'file_size',
    'ns_size'
  ];
  var stats = {};

  keys.map(function(k) {
    stats[k] = 0;
  });

  databases.map(function(db) {
    keys.map(function(k) {
      stats[k] += db[k];
    });
  });
  fn(null, stats);
}

function getHost(req, fn) {
  req.mongo.admin().command({
    hostInfo: 1
  }, {}, function(err, data) {
    if (err) return fn(err);

    fn(null, {
      system_time: data.system.currentTime,
      hostname: data.system.hostname,
      os: data.os.name,
      os_family: data.os.type.toLowerCase(),
      kernel_version: data.os.version,
      kernel_version_string: data.extra.versionString,
      memory_bits: data.system.memSizeMB * 1024 * 1024,
      memory_page_size: data.extra.pageSize,
      arch: data.system.cpuArch,
      cpu_cores: data.system.numCores,
      cpu_cores_physical: data.extra.physicalCores,
      cpu_scheduler: data.extra.scheduler,
      cpu_frequency: data.extra.cpuFrequencyMHz * 1000000,
      cpu_string: data.extra.cpuString,
      cpu_bits: data.system.cpuAddrSize,
      machine_model: data.extra.model,
      feature_numa: data.system.numaEnabled,
      feature_always_full_sync: data.extra.alwaysFullSync,
      feature_nfs_async: data.extra.nfsAsync
    });
  });
}

function getBuild(req, fn) {
  req.mongo.admin().buildInfo(function(err, data) {
    if (err) return fn(err);
    if (!data) {
      return fn(boom.notAuthorized('not authorized to view build info'));
    }

    fn(null, {
      version: data.version,
      commit: data.gitVersion,
      commit_url: 'https://github.com/mongodb/mongo/commit/' + data.gitVersion,
      flags_loader: data.loaderFlags,
      flags_compiler: data.compilerFlags,
      allocator: data.allocator,
      javascript_engine: data.javascriptEngine,
      debug: data.debug,
      for_bits: data.bits,
      max_bson_object_size: data.maxBsonObjectSize,
    });
  });
}
