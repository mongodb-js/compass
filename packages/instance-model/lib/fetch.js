var async = require('async');
var ReadPreference = require('mongodb-read-preference');
var isNotAuthorized = require('mongodb-js-errors').isNotAuthorized;
var toNS = require('mongodb-ns');
var security = require('mongodb-security');
var _ = require('lodash');

var debug = require('debug')('mongodb-instance-model:fetch');

/**
 * aggregates stats across all found databases
 * @param  {Function} done      callback
 * @param  {Object}   results   async.auto results
 */
function getStats(done, results) {
  var databases = results.databases;

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
  done(null, stats);
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

function getBuildInfo(done, results) {
  var db = results.db;

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
 * @param {Function} done
 * @param {mongo.Db} results
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
function getHostInfo(done, results) {
  var db = results.db;

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


function listDatabases(done, results) {
  var db = results.db;
  var userInfo = results.userInfo;

  var cluster = security.getResourcesWithActions(
    userInfo, ['listDatabases'], 'special').filter(function(resource) {
      return resource.cluster;
    });

  if (!cluster) {
    // user does not have privilege to run listDatabases, don't even try
    done(null, []);
  }

  var options = {
    readPreference: ReadPreference.nearest
  };

  var spec = {
    listDatabases: 1
  };

  db.admin().command(spec, options, function(err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        debug('listDatabases failed. returning empty list []');
        done(null, []);
        return;
      }

      debug('listDatabases failed', err);
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

    debug('listDatabases succeeded!', {
      res: JSON.stringify(res),
      names: names
    });
    done(null, names);
  });
}


function parseDatabase(resp) {
  return {
    _id: resp.db,
    name: resp.db,
    document_count: resp.objects || 0,
    storage_size: resp.storageSize || 0,
    index_count: resp.indexes || 0,
    index_size: resp.indexSize || 0
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
      debug('dbStats failed. Falling back to no stats.');
      res = {};
    } else {
      debug('got dbStats for `%s`', name, res);
    }
    res.db = res.db || name;
    done(null, parseDatabase(res));
  });
}


function getDatabases(done, results) {
  var db = results.db;

  // merge and de-dupe databases
  var dbnames = _.union(results.listDatabases, results.allowedDatabases);

  async.parallel(_.map(dbnames, function(name) {
    var result = _.partial(getDatabase, db, name);
    return result;
  }), function(err, res) {
    done(err, res);
  });
}


function getUserInfo(done, results) {
  var db = results.db;

  // get the user privileges
  db.command({
    connectionStatus: 1,
    showPrivileges: true
  }, function(err, res) {
    if (err) {
      done(err);
    }
    var user = res.authInfo.authenticatedUsers[0];
    if (!user) {
      debug('no logged in user, returning empty document');
      return done(null, {});
    }

    db.command({
      usersInfo: user,
      showPrivileges: true
    }, function(_err, _res) {
      if (_err) {
        done(_err);
      }
      done(null, _res.users[0]);
    });
  });
}

function getAllowedDatabases(done, results) {
  var userInfo = results.userInfo;

  // get databases on which the user is allowed to call listCollections
  var databases = security.getResourcesWithActions(
    userInfo, ['listCollections'], 'database').map(function(resource) {
      return resource.db;
    });

  done(null, databases);
}

function parseCollection(resp) {
  var ns = toNS(resp.db + '.' + resp.name);
  return {
    _id: ns.toString(),
    name: ns.collection,
    database: ns.database
  };
}

function getAllowedCollections(done, results) {
  var userInfo = results.userInfo;

  // get collections on which the user is allowed to call find and collStats
  var compassActions = ['find', 'collStats'];
  var collections = security.getResourcesWithActions(
    userInfo, compassActions, 'collection').map(function(resource) {
      return {
        db: resource.db,
        name: resource.collection
      };
    });

  collections = _.map(collections, parseCollection);
  debug('allowed collections', collections);
  done(null, collections);
}

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

function getCollections(done, results) {
  // var db = results.db;

  // concat
  var collections = [].concat.apply(
    results.listCollections, results.allowedCollections);
  // de-dupe based on _id
  collections = _.uniq(collections, '_id');

  // @todo filter the ones that we can "count on"
  // async.filter(collections, function(collection, callback) {
  //   db.db(collection.database).collection(collection.name).count(function(err) {
  //     if (err) {
  //       return callback(false);
  //     }
  //     callback(true);
  //   });
  // }, function(countableCollections) {
  //   done(null, countableCollections);
  // });
  done(null, collections);
}

function listCollections(done, results) {
  var db = results.db;
  var databases = results.databases;

  // merge and de-dupe databases
  var dbnames = _.pluck(databases, 'name');
  var tasks = _.map(dbnames, function(name) {
    return getDatabaseCollections.bind(null, db.db(name));
  });

  async.parallel(tasks, function(err, res) {
    if (err) {
      debug('listCollections failed', err);
      return done(err);
    }
    done(null, _.flatten(res));
  });
}

function getHierarchy(done, results) {
  var databases = results.databases;
  var collections = _.groupBy(results.collections, function(collection) {
    return collection.database;
  });
  _.each(databases, function(db) {
    db.collections = collections[db.name] || [];
  });
  done();
}


function attach(anything, done) {
  done(null, anything);
}

/**
 * pass in a connection model and get instance details back.
 * @param  {Mongo.db}   db     database handle from the node driver
 * @param  {Function} done     callback
 */
function getInstanceDetail(db, done) {
  var tasks = {
    db: attach.bind(null, db),
    userInfo: ['db', getUserInfo],

    host: ['db', getHostInfo],
    build: ['db', getBuildInfo],

    listDatabases: ['db', 'userInfo', listDatabases],
    allowedDatabases: ['userInfo', getAllowedDatabases],
    databases: ['db', 'listDatabases', 'allowedDatabases', getDatabases],

    listCollections: ['db', 'databases', listCollections],
    allowedCollections: ['userInfo', getAllowedCollections],
    collections: ['db', 'listCollections', 'allowedCollections', getCollections],

    hierarchy: ['databases', 'collections', getHierarchy],

    stats: ['databases', getStats]
  };

  async.auto(tasks, function(err, results) {
    if (err) {
      // report error
      return done(err);
    }
    // cleanup
    results = _.omit(results, ['db', 'listDatabases', 'allowedDatabases',
      'userInfo', 'listCollections', 'allowedCollections']);
    return done(null, results);
  });
}


module.exports = getInstanceDetail;

// module.exports.getCollections = getCollections;
// module.exports.getDatabaseCollections = getDatabaseCollections;
// module.exports.getDatabases = getDatabases;
// module.exports.getDatabase = getDatabase;
// module.exports.getBuildInfo = getBuildInfo;
// module.exports.getHostInfo = getHostInfo;
