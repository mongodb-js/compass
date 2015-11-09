var _ = require('lodash');
var async = require('async');
var toNS = require('mongodb-ns');
var isNotAuthorized = require('mongodb-js-errors').isNotAuthorized;
var debug = require('debug')('mongodb-instance:fetch');
var ReadPreference = require('mongodb-read-preference');

function rollupAllDatabaseStats(databases, fn) {
  var keys = [
    'document_count',
    'storage_size',
    'index_count',
    'index_size'
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

/**
 * @example
 *
 * @param {Object} resp - Result of `db.admin().command({buildInfo: 1})`.
 * @return {Object}
 */
function parseBuildInfo(resp) {
  var res = {
    version: resp.version,
    commit: resp.gitVersion,
    commit_url: 'https://github.com/mongodb/mongo/commit/' + resp.gitVersion,
    flags_loader: resp.loaderFlags,
    flags_compiler: resp.compilerFlags,
    allocator: resp.allocator,
    javascript_engine: resp.javascriptEngine,
    debug: resp.debug,
    for_bits: resp.bits,
    max_bson_object_size: resp.maxBsonObjectSize,
    enterprise_module: false
  };
  if (resp.modules && resp.modules.indexOf('enterprise') !== -1) {
    res.enterprise_module = true;
  }
  return res;
}

function getBuildInfo(db, done) {
  debug('checking we can get buildInfo...');
  db.admin().buildInfo(function(err, res) {
    if (err) {
      debug('buildInfo failed!', err);
      err.command = 'buildInfo';
      return done(err);
    }
    done(null, parseBuildInfo(res));
  });
}

/**
 * @param {Object} resp - Result of `db.admin().command({hostInfo: 1})`.
 * @return {Object}
 */
function parseHostInfo(resp) {
  return {
    system_time: resp.system.currentTime,
    hostname: resp.system.hostname,
    os: resp.os.name,
    os_family: resp.os.type.toLowerCase(),
    kernel_version: resp.os.version,
    kernel_version_string: resp.extra.versionString,
    memory_bits: resp.system.memSizeMB * 1024 * 1024,
    memory_page_size: resp.extra.pageSize,
    arch: resp.system.cpuArch,
    cpu_cores: resp.system.numCores,
    cpu_cores_physical: resp.extra.physicalCores,
    cpu_scheduler: resp.extra.scheduler,
    cpu_frequency: resp.extra.cpuFrequencyMHz * 1000000,
    cpu_string: resp.extra.cpuString,
    cpu_bits: resp.system.cpuAddrSize,
    machine_model: resp.extra.model,
    feature_numa: resp.system.numaEnabled,
    /* `alwaysFullSync` seen as synchronous :p */
    /* eslint no-sync: 0 */
    feature_always_full_sync: resp.extra.alwaysFullSync,
    feature_nfs_async: resp.extra.nfsAsync
  };
}

/**
 * @param {mongo.Db} db
 * @param {Function} done
 *
 * @example
 *   { system_time: Sun Nov 08 2015 19:40:59 GMT-0500 (EST),
 *     hostname: 'lucas.local',
 *     os: 'Mac OS X',
 *     os_family: 'darwin',
 *     kernel_version: '14.5.0\u0000',
 *     kernel_version_string: 'Darwin Kernel Version 14.5.0: Tue Sep  1 21:23:09 PDT 2015; root:xnu-2782.50.1~1/RELEASE_X86_64\u0000',
 *     memory_bits: 17179869184,
 *     memory_page_size: 4096,
 *     arch: 'x86_64\u0000',
 *     cpu_cores: 4,
 *     cpu_cores_physical: 2,
 *     cpu_scheduler: 'multiq\u0000',
 *     cpu_frequency: 2800000000,
 *     cpu_string: 'Intel(R) Core(TM) i7-4558U CPU @ 2.80GHz\u0000',
 *     cpu_bits: 64,
 *     machine_model: 'MacBookPro11,1\u0000',
 *     feature_numa: false,
 *     feature_always_full_sync: 0,
 *     feature_nfs_async: 0 }
 */
function getHostInfo(db, done) {
  debug('checking we can get hostInfo...');
  var spec = {
    hostInfo: 1
  };
  var options = {};
  db.admin().command(spec, options, function(err, res) {
    if (err) {
      if (/^not authorized/.test(err.message)) {
        debug('hostInfo unavailable for this user and thats ok!');
        done(null, {});
        return;
      }
      debug('driver error', err);
      err.command = 'hostInfo';
      done(err);
      return;
    }
    debug('got hostInfo successully!');
    done(null, parseHostInfo(res));
  });
}

function getDatabaseNames(db, done) {
  debug('checking we can get database names...');
  var options = {
    readPreference: ReadPreference.nearest
  };

  var spec = {
    listDatabases: 1
  };

  db.admin().command(spec, options, function(err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        debug('list databases failed.  Falling back to single database.');
        done(null, [db.databaseName]);
        return;
      }

      debug('list database names failed', err);
      err.command = 'listDatabases';
      done(err);
      return;
    }

    var names = res.databases
      .map(function(d) {
        return d.name;
      });
      // .filter(function(name) {
      //   if (name === 'admin') {
      //     return false;
      //   }
      //   return true;
      // });

    debug('list database names succeeded!', {
      res: res,
      names: names
    });
    done(null, names);
  });
}

function parseDatabase(resp) {
  return {
    _id: resp.db,
    name: resp.db,
    document_count: resp.objects,
    storage_size: resp.storageSize,
    index_count: resp.indexes,
    index_size: resp.indexSize
  };
}

/**
 * @param {mongo.Db} db
 * @param {String} [name]
 * @param {Function} done

 * @example
 *   {
 *     _id: 'yelp',
 *     name: 'yelp',
 *     document_count: 656617,
 *     storage_size: 200200192,
 *     index_count: 3,
 *     index_size: 5496832
 *   }
 */
function getDatabase(db, name, done) {
  if (typeof name === 'function') {
    done = name;
    name = db.databaseName;
  }

  var spec = {
    dbStats: 1
  };

  var options = {};
  debug('running dbStats for `%s`...', name);
  db.db(name).command(spec, options, function(err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        debug('dbStats failed.  Falling back to no stats.');
        done(null, {});
        return;
      }

      debug('failed to get dbStats for `%s`', name, err);
      err.command = 'dbStats';
      done(err);
      return;
    }
    debug('got dbStats for `%s`', name);
    done(null, parseDatabase(res));
  });
}

function getDatabases(db, done) {
  debug('checking we can get databases...');
  getDatabaseNames(db, function(err, names) {
    if (err) {
      return done(err);
    }

    async.parallel(_.map(names, function(name) {
      return _.partial(getDatabase, db, name);
    }), done);
  });
}

function parseCollection(resp) {
  var ns = toNS(resp.db + '.' + resp.name);
  return {
    _id: ns.toString(),
    name: ns.collection,
    database: ns.database
  };
}

/**
 * @param {mongo.Db} db
 * @param {Function} done
 * @example
 *   [
 *     { _id: 'test.INT_407', name: 'INT_407', database: 'test' },
 *     { _id: 'test.test', name: 'test', database: 'test' },
 *     { _id: 'yelp.business', name: 'business', database: 'yelp' },
 *     { _id: 'yelp.checkin', name: 'checkin', database: 'yelp' },
 *     { _id: 'yelp.user', name: 'user', database: 'yelp' }
 *   ]
 */
function getDatabaseCollections(db, done) {
  debug('getDatabaseCollections...');

  var options = {
    readPreference: ReadPreference.nearest
  };

  var spec = {};

  db.listCollections(spec, options).toArray(function(err, res) {
    if (err) {
      err.command = 'listCollections';
      return done(err);
    }
    done(null, _.map(res, function(d) {
      d.db = db.databaseName;
      return parseCollection(d);
    }));
  });
}

function getAllCollections(db, done) {
  debug('checking we can get all collections for databases...');
  getDatabaseNames(db, function(err, names) {
    if (err) {
      return done(err);
    }

    var tasks = names.map(function(name) {
      return getDatabaseCollections.bind(null, db.db(name));
    });

    async.parallel(tasks, function(_err, res) {
      if (_err) {
        debug('getCollections failed', _err);
        return done(_err);
      }
      debug('getCollections succeeded!');
      done(null, _.flatten(res));
    });
  });
}


function getInstanceDetail(db, fn) {
  var tasks = {
    databases: getDatabases.bind(null, db),
    collections: getAllCollections.bind(null, db),
    host: getHostInfo.bind(null, db),
    build: getBuildInfo.bind(null, db)
  };

  async.parallel(tasks, function(err, res) {
    if (err) {
      return fn(err);
    }

    rollupAllDatabaseStats(res.databases, function(_err, stats) {
      if (_err) {
        return fn(_err);
      }

      res.stats = stats;

      debug('instance detail is `%j`', res);
      fn(null, res);
    });
  });
}

module.exports = getInstanceDetail;

module.exports.getDatabaseNames = getDatabaseNames;
module.exports.getAllCollections = getAllCollections;
module.exports.getDatabaseCollections = getDatabaseCollections;
module.exports.getDatabases = getDatabases;
module.exports.getDatabase = getDatabase;
module.exports.getBuildInfo = getBuildInfo;
module.exports.getHostInfo = getHostInfo;
module.exports.getDatabaseNames = getDatabaseNames;
