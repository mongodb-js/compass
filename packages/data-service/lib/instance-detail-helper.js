const async = require('async');
const isNotAuthorized = require('mongodb-js-errors').isNotAuthorized;
const toNS = require('mongodb-ns');
const security = require('mongodb-security');
const ReadPreference = require('mongodb').ReadPreference;
const URL = require('mongodb-url');
const union = require('lodash.union');
const map = require('lodash.map');
const partial = require('lodash.partial');
const has = require('lodash.has');
const get = require('lodash.get');
const uniqBy = require('lodash.uniqby');
const flatten = require('lodash.flatten');
const groupBy = require('lodash.groupby');
const forEach = require('lodash.foreach');
const omit = require('lodash.omit');

const debug = require('debug')('mongodb-data-service:instance-detail-helper');

/**
 * aggregates stats across all found databases
 * @param  {Object}   results   async.auto results
 * @param  {Function} done      callback
 */
function getStats(results, done) {
  const databases = results.databases;

  const keys = [
    'document_count',
    'storage_size',
    'index_count',
    'index_size'
  ];
  const stats = {};
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
 * @param {Object} resp - Result of `db.db('admin').command({buildInfo: 1})`.
 * @return {Object}
 */
function parseBuildInfo(resp) {
  const res = {
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
    enterprise_module: false,
    raw: resp // Save the raw output to later determine if genuine MongoDB
  };
  // cover both cases of detecting enterprise module, see SERVER-18099
  if (resp.gitVersion && resp.gitVersion.match(/enterprise/)) {
    res.enterprise_module = true;
  }
  if (resp.modules && resp.modules.indexOf('enterprise') !== -1) {
    res.enterprise_module = true;
  }
  return res;
}

function getBuildInfo(results, done) {
  const db = results.db;

  debug('checking we can get buildInfo...');
  const spec = {
    buildInfo: 1
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, {}, function(err, res) {
    if (err) {
      // buildInfo doesn't require any privileges to run, so if it fails,
      // something really went wrong and we should return the error.
      debug('buildInfo failed!', err);
      err.command = 'buildInfo';
      return done(err);
    }
    done(null, parseBuildInfo(res));
  });
}

function getCmdLineOpts(results, done) {
  const db = results.db;

  const spec = {
    getCmdLineOpts: 1
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, {}, function(err, res) {
    if (err) {
      debug('getCmdLineOpts failed!', err);
      return done(null, { errmsg: err.message });
    }
    done(null, res);
  });
}

function getGenuineMongoDB(results, done) {
  const buildInfo = results.build.raw;
  const cmdLineOpts = results.cmdLineOpts;

  const res = {
    isGenuine: true,
    dbType: 'mongodb'
  };

  if (buildInfo.hasOwnProperty('_t' )) {
    res.isGenuine = false;
    res.dbType = 'cosmosdb';
  }
  if (cmdLineOpts.hasOwnProperty('errmsg') && cmdLineOpts.errmsg.indexOf('not supported') !== -1) {
    res.isGenuine = false;
    res.dbType = 'documentdb';
  }
  done(null, res);
}

/**
 * @param {Object} resp - Result of `db.db('admin').command({hostInfo: 1})`.
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
 * @param {mongo.Db} results
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
function getHostInfo(results, done) {
  const db = results.db;

  const spec = {
    hostInfo: 1
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, {}, function(err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        // if the error is that the user is not authorized, silently ignore it
        // and return an empty document
        debug('user does not have hostInfo privilege, returning empty document {}');
        done(null, {});
        return;
      }
      // something else went wrong and we should return the error.
      debug('driver error', err);
      err.command = 'hostInfo';
      done(err);
      return;
    }
    done(null, parseHostInfo(res));
  });
}


function listDatabases(results, done) {
  const db = results.db;
  const userInfo = results.userInfo;

  const cluster = security.getResourcesWithActions(
    userInfo, ['listDatabases']).filter(function(resource) {
      return resource.cluster;
    });

  if (!cluster) {
    // user does not have privilege to run listDatabases, don't even try
    done(null, []);
  }

  const spec = {
    listDatabases: 1
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, {}, function(err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        // we caught this further up already and really should never get here!
        debug('listDatabases failed. returning empty list []');
        done(null, []);
        return;
      }
      // the command failed for another reason, report the error
      debug('listDatabases failed', err);
      err.command = 'listDatabases';
      done(err);
      return;
    }

    const names = res.databases.map(function(d) {
      return d.name;
    });

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
 * @param {MongoClient} client - The client.
 * @param {DB} db - The db.
 * @param {String} name - The name.
 * @param {Function} done - The callback.

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
function getDatabase(client, db, name, done) {
  if (typeof name === 'function') {
    done = name;
    name = db.databaseName;
  }

  const spec = {
    dbStats: 1
  };

  const options = {};
  debug('running dbStats for `%s`...', name);
  client.db(name).command(spec, options, function(err, res) {
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


function getDatabases(results, done) {
  const db = results.db;
  const client = results.client;

  // merge and de-dupe databases
  const dbnames = union(results.listDatabases, results.allowedDatabases);

  async.parallel(map(dbnames, function(name) {
    const result = partial(getDatabase, client, db, name);
    return result;
  }), done);
}


function getUserInfo(results, done) {
  const db = results.db;

  // get the user privileges
  db.command({ connectionStatus: 1, showPrivileges: true }, {}, function(err, res) {
    // no auth required, if this fails there was a real problem
    if (err) {
      return done(err);
    }
    if (!has(res, 'authInfo.authenticatedUsers') || !res.authInfo.authenticatedUsers[0]) {
      debug('no logged in user, returning empty document');
      return done(null, {});
    }
    const user = res.authInfo.authenticatedUsers[0];

    db.command({ usersInfo: user, showPrivileges: true }, {}, function(_err, _res) {
      if (_err) {
        // @durran: For the case usersInfo cannot be retrieved.
        debug('Command \"usersInfo\" could not be retrieved: ' + _err.message);
        return done(null, {});
      }
      // For the case azure cosmosDB bug
      done(null, _res.users[0] || {});
    });
  });
}

function getAllowedDatabases(results, done) {
  const userInfo = results.userInfo;

  // get databases on which the user is allowed to call listCollections
  let databases = security.getResourcesWithActions(
    userInfo, ['listCollections']).map(function(resource) {
      return resource.db;
    });
  databases = databases.concat(security.getResourcesWithActions(
    userInfo, ['find']).map(function(resource) {
      return resource.db;
    }));

  done(null, databases.filter((f, i) => (f && databases.indexOf(f) === i)));
}

function parseCollection(resp) {
  const ns = toNS(resp.db + '.' + resp.name);
  return {
    _id: ns.toString(),
    name: ns.collection,
    database: ns.database,
    readonly: get(resp, 'info.readOnly', false),
    collation: get(resp, 'options.collation', null)
  };
}

function getAllowedCollections(results, done) {
  const userInfo = results.userInfo;

  // get collections on which the user is allowed to call find and collStats
  const compassActions = ['find', 'collStats'];
  let collections = security.getResourcesWithActions(
    userInfo, compassActions).map(function(resource) {
      return {
        db: resource.db,
        name: resource.collection
      };
    });
  collections = collections.concat(security.getResourcesWithActions(
    userInfo, ['find']).map(function(resource) {
      return {
        db: resource.db,
        name: resource.collection
      };
    })).filter((f) => (f.name));

  collections = uniqBy(collections, (c) => (`${c.db}.${c.name}`));
  collections = map(collections, parseCollection);
  debug('allowed collections', collections);
  done(null, collections);
}

function isMongosLocalException(err) {
  if (!err) {
    return false;
  }
  var msg = err.message || err.err || JSON.stringify(err);
  return new RegExp('database through mongos').test(msg);
}

function getDatabaseCollections(db, done) {
  debug('getDatabaseCollections...');

  const spec = {};

  /**
   * @note: Durran: For some reason the listCollections call does not take into
   *  account the read preference that was set on the db instance - it only looks
   *  in the passed options: https://github.com/mongodb/node-mongodb-native/blob/2.2/lib/db.js#L671
   */
  const rp = db.s ? db.s.readPreference : ReadPreference.PRIMARY;
  const options = { readPreference: rp };

  db.listCollections(spec, options).toArray(function(err, res) {
    if (err) {
      if (isNotAuthorized(err) || isMongosLocalException(err)) {
        // if the error is that the user is not authorized, silently ignore it
        // and return an empty list, same for trying to listCollections on local
        // db in Mongos
        debug('not allowed to run `listCollections` command on %s, returning'
          + ' empty result [].', db.databaseName);
        return done(null, []);
      }
      // the command failed for another reason, report the error
      debug('listCollections failed', err);
      err.command = 'listCollections';
      return done(err);
    }
    done(null, map(res, function(d) {
      d.db = db.databaseName;
      return parseCollection(d);
    }));
  });
}

function getCollections(results, done) {
  // var db = results.db;

  // concat
  let collections = [].concat.apply(
    results.listCollections, results.allowedCollections
  ).filter((f) => (f.name !== ''));
  // de-dupe based on _id
  collections = uniqBy(collections, (c) => (c._id));

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

function listCollections(results, done) {
  const client = results.client;
  const databases = results.databases;

  // merge and de-dupe databases
  const tasks = map(databases, function(_db) {
    return getDatabaseCollections.bind(null, client.db(_db.name));
  });

  async.parallel(tasks, function(err, res) {
    if (err) {
      debug('listCollections failed', err);
      return done(err);
    }
    done(null, flatten(res));
  });
}

function getHierarchy(results, done) {
  const databases = results.databases;
  const collections = groupBy(results.collections, function(collection) {
    return collection.database;
  });
  forEach(databases, function(db) {
    db.collections = collections[db.name] || [];
  });
  done();
}


function attach(anything, done) {
  done(null, anything);
}

/**
 * Retrieves many instance details, such as the build and host info,
 * databases and collections which the user has access to.
 *
 * @param {MongoClient} client - The client.
 * @param {DB} db - database handle from the node driver
 * @param {Function} done - callback
 */
function getInstanceDetail(client, db, done) {
  const tasks = {
    client: attach.bind(null, client),
    db: attach.bind(null, db),
    userInfo: ['client', 'db', getUserInfo],

    host: ['client', 'db', getHostInfo],
    build: ['client', 'db', getBuildInfo],
    cmdLineOpts: ['client', 'db', getCmdLineOpts],
    genuineMongoDB: ['build', 'cmdLineOpts', getGenuineMongoDB],

    listDatabases: ['client', 'db', 'userInfo', listDatabases],
    allowedDatabases: ['userInfo', getAllowedDatabases],
    databases: ['client', 'db', 'listDatabases', 'allowedDatabases', getDatabases],

    listCollections: ['client', 'db', 'databases', listCollections],
    allowedCollections: ['userInfo', getAllowedCollections],
    collections: ['client', 'db', 'listCollections', 'allowedCollections', getCollections],

    hierarchy: ['databases', 'collections', getHierarchy],

    stats: ['databases', getStats]
  };

  async.auto(tasks, function(err, results) {
    if (err) {
      // report error
      return done(err);
    }
    // cleanup
    results = omit(results, ['db', 'listDatabases', 'allowedDatabases',
      'userInfo', 'listCollections', 'allowedCollections', 'cmdLineOpts']);
    return done(null, results);
  });
}

function getInstance(client, db, done) {
  getInstanceDetail(client, db, function(err, res) {
    if (err) {
      return done(err);
    }

    let port;
    let hostname;

    if (has(db, 's.options.url')) {
      debug('parsing port and hostname from driver url option `%s`',
        db.s.options.url);
      port = URL.port(db.s.options.url);
      hostname = URL.hostname(db.s.options.url);
    }

    if (has(res, 'host.hostname')) {
      /**
       * Use the hostname from getBuildInfo() as authoritative.
       *
       * NOTE (imlucas) In the real world, `db.s.options.url`
       * gives a guarantee that the hostname is routable
       * from the users perspective.  The hostname returned by
       * getBuildInfo() may not (e.g. AWS' internal DNS for EC2).
       */
      hostname = URL.hostname(res.host.hostname);
      if (/\:\d+/.test(res.host.hostname)) {
        port = URL.port(res.host.hostname);
      }
    }

    res._id = [hostname, port].join(':');
    debug('instance.get returning', res);
    done(null, res);
  });
}

module.exports = {
  getAllowedCollections,
  getAllowedDatabases,
  getBuildInfo,
  getCmdLineOpts,
  getDatabaseCollections,
  getGenuineMongoDB,
  getHostInfo,
  getInstance,
  listCollections,
  listDatabases
};
