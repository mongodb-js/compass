const async = require('async');
const isNotAuthorized = require('mongodb-js-errors').isNotAuthorized;
const toNS = require('mongodb-ns');
const security = require('mongodb-security');
const ReadPreference = require('mongodb').ReadPreference;
const URL = require('mongodb-url');
const getMongoDBBuildInfo = require('mongodb-build-info');
const {
  union,
  map,
  partial,
  has,
  get,
  uniqBy,
  flatten,
  groupBy,
  forEach,
  omit,
} = require('lodash');

const debug = require('debug')('mongodb-data-service:instance-detail-helper');

function getReadPreferenceOptions(db) {
  // `db.command` does not use the read preference set on the
  // connection, so here we explicitly to specify it in the options.
  const readPreference = db.s ? db.s.readPreference : ReadPreference.PRIMARY;
  return { readPreference };
}

/**
 * aggregates stats across all found databases
 * @param  {Object}   results   async.auto results
 * @param  {Function} done      callback
 */
function getStats(results, done) {
  const databases = results.databases;

  const keys = ['document_count', 'storage_size', 'index_count', 'index_size'];
  const stats = {};
  keys.map(function (k) {
    stats[k] = 0;
  });
  databases.map(function (db) {
    keys.map(function (k) {
      stats[k] += db[k];
    });
  });
  done(null, stats);
}

/**
 * @example
 *
 * @param {Object} buildInfo - Result of `db.db('admin').command({buildInfo: 1})`.
 * @return {Object}
 */
function parseBuildInfo(buildInfo) {
  buildInfo = buildInfo || {};

  const res = {
    version: buildInfo.version,
    commit: buildInfo.gitVersion,
    commit_url: buildInfo.gitVersion
      ? 'https://github.com/mongodb/mongo/commit/' + buildInfo.gitVersion
      : '',
    flags_loader: buildInfo.loaderFlags,
    flags_compiler: buildInfo.compilerFlags,
    allocator: buildInfo.allocator,
    javascript_engine: buildInfo.javascriptEngine,
    debug: buildInfo.debug,
    for_bits: buildInfo.bits,
    max_bson_object_size: buildInfo.maxBsonObjectSize,
    enterprise_module: getMongoDBBuildInfo.isEnterprise(buildInfo), // Cover both cases of detecting enterprise module, see SERVER-18099.
    query_engine: buildInfo.queryEngine ? buildInfo.queryEngine : null,
    raw: buildInfo, // Save the raw output to later determine if genuine MongoDB
  };

  return res;
}

function getBuildInfo(results, done) {
  const db = results.db;

  debug('checking we can get buildInfo...');
  const spec = {
    buildInfo: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, getReadPreferenceOptions(db), function (err, res) {
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
    getCmdLineOpts: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, getReadPreferenceOptions(db), function (err, res) {
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

  debug(
    'genuineMongoDB check: buildInfo and cmdLineOpts',
    buildInfo,
    cmdLineOpts
  );

  const { isGenuine, serverName } = getMongoDBBuildInfo.getGenuineMongoDB(
    buildInfo,
    cmdLineOpts
  );

  const res = {
    isGenuine,
    dbType: serverName,
  };

  done(null, res);
}

function getDataLake(results, done) {
  const buildInfo = results.build.raw;

  debug('isDataLake check: buildInfo.dataLake', buildInfo.dataLake);

  const { isDataLake, dlVersion } = getMongoDBBuildInfo.getDataLake(buildInfo);

  const res = {
    isDataLake,
    version: dlVersion,
  };

  done(null, res);
}

/**
 * @param {Object} hostInfo - Result of `db.db('admin').command({hostInfo: 1})`.
 * @return {Object}
 */
function parseHostInfo(hostInfo) {
  hostInfo = hostInfo || {};
  const hostInfoSystem = hostInfo.system || {};
  const hostInfoOs = hostInfo.os || {};
  const hostInfoExtra = hostInfo.extra || {};

  return {
    system_time: hostInfoSystem.currentTime,
    hostname: hostInfoSystem.hostname || 'unknown',
    os: hostInfoOs.name,
    os_family: (hostInfoOs.type || 'unknown').toLowerCase(),
    kernel_version: hostInfoOs.version,
    kernel_version_string: hostInfoExtra.versionString,
    memory_bits: (hostInfoSystem.memSizeMB || 0) * 1024 * 1024,
    memory_page_size: hostInfoExtra.pageSize,
    arch: hostInfoSystem.cpuArch,
    cpu_cores: hostInfoSystem.numCores,
    cpu_cores_physical: hostInfoExtra.physicalCores,
    cpu_scheduler: hostInfoExtra.scheduler,
    cpu_frequency: (hostInfoExtra.cpuFrequencyMHz || 0) * 1000000,
    cpu_string: hostInfoExtra.cpuString,
    cpu_bits: hostInfoSystem.cpuAddrSize,
    machine_model: hostInfoExtra.model,
    feature_numa: hostInfoSystem.numaEnabled,
    /* `alwaysFullSync` seen as synchronous :p */
    /* eslint no-sync: 0 */
    feature_always_full_sync: hostInfoExtra.alwaysFullSync,
    feature_nfs_async: hostInfoExtra.nfsAsync,
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
    hostInfo: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, getReadPreferenceOptions(db), function (err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        // if the error is that the user is not authorized, silently ignore it
        // and return an empty document
        debug(
          'user does not have hostInfo privilege, returning empty document {}'
        );
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

  const cluster = security
    .getResourcesWithActions(userInfo, ['listDatabases'])
    .filter(function (resource) {
      return resource.cluster;
    });

  if (!cluster) {
    // user does not have privilege to run listDatabases, don't even try
    done(null, []);
  }

  const spec = {
    listDatabases: 1,
  };

  const options = getReadPreferenceOptions(db);

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  adminDb.command(spec, options, function (err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        // eslint-disable-next-line no-shadow
        adminDb.command(
          { connectionStatus: 1, showPrivileges: 1 },
          options,
          function (err, res) {
            if (err) {
              done(err);
              return;
            }
            const privileges = (res.authInfo || {}).authenticatedUserPrivileges;
            if (privileges === undefined) {
              done(null, []);
              return;
            }

            done(
              null,
              privileges
                .filter(function (priv) {
                  // Find all named databases in priv list.
                  return ((priv.resource || {}).db || '').length > 0;
                })
                .map(function (priv) {
                  // Return just the names.
                  return priv.resource.db;
                })
                // eslint-disable-next-line no-shadow
                .filter(function (db, idx, arr) {
                  // Make sure the list is unique
                  return arr.indexOf(db) === idx;
                })
                .sort()
            );
          }
        );
        return;
      }
      // the command failed for another reason, report the error
      debug('listDatabases failed', err);
      err.command = 'listDatabases';
      done(err);
      return;
    }

    const names = res.databases.map(function (d) {
      return d.name;
    });

    debug('listDatabases succeeded!', {
      res: JSON.stringify(res),
      names: names,
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
    index_size: resp.indexSize || 0,
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
    dbStats: 1,
  };

  const options = getReadPreferenceOptions(db);
  debug('running dbStats for `%s`...', name);
  client.db(name).command(spec, options, function (err, res) {
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

  async.parallel(
    map(dbnames, function (name) {
      const result = partial(getDatabase, client, db, name);
      return result;
    }),
    done
  );
}

function getUserInfo(results, done) {
  const db = results.db;

  const options = getReadPreferenceOptions(db);

  // get the user privileges
  db.command(
    {
      connectionStatus: 1,
      showPrivileges: true,
    },
    options,
    function (err, res) {
      // no auth required, if this fails there was a real problem
      if (err) {
        return done(err);
      }
      if (
        !has(res, 'authInfo.authenticatedUsers') ||
        !res.authInfo.authenticatedUsers[0]
      ) {
        debug('no logged in user, returning empty document');
        return done(null, {});
      }
      const user = res.authInfo.authenticatedUsers[0];

      db.command(
        { usersInfo: user, showPrivileges: true },
        options,
        function (_err, _res) {
          if (_err) {
            // @durran: For the case usersInfo cannot be retrieved.
            debug(
              'Command "usersInfo" could not be retrieved: ' + _err.message
            );
            return done(null, {});
          }
          // For the case azure cosmosDB bug
          done(null, _res.users[0] || {});
        }
      );
    }
  );
}

function getAllowedDatabases(results, done) {
  const userInfo = results.userInfo;

  // get databases on which the user is allowed to call listCollections
  let databases = security
    .getResourcesWithActions(userInfo, ['listCollections'])
    .map(function (resource) {
      return resource.db;
    });
  databases = databases.concat(
    security
      .getResourcesWithActions(userInfo, ['find'])
      .map(function (resource) {
        return resource.db;
      })
  );

  done(
    null,
    databases.filter((f, i) => f && databases.indexOf(f) === i)
  );
}

function parseCollection(resp) {
  const ns = toNS(resp.db + '.' + resp.name);
  return {
    _id: ns.toString(),
    name: ns.collection,
    database: ns.database,
    readonly: get(resp, 'info.readOnly', false),
    collation: get(resp, 'options.collation', null),
    type: get(resp, 'type', 'collection'),
    view_on: get(resp, 'options.viewOn', undefined),
    pipeline: get(resp, 'options.pipeline', undefined),
  };
}

function getAllowedCollections(results, done) {
  const userInfo = results.userInfo;

  // get collections on which the user is allowed to call find and collStats
  const compassActions = ['find', 'collStats'];
  let collections = security
    .getResourcesWithActions(userInfo, compassActions)
    .map(function (resource) {
      return {
        db: resource.db,
        name: resource.collection,
      };
    });
  collections = collections
    .concat(
      security
        .getResourcesWithActions(userInfo, ['find'])
        .map(function (resource) {
          return {
            db: resource.db,
            name: resource.collection,
          };
        })
    )
    .filter((f) => f.name);

  collections = uniqBy(collections, (c) => `${c.db}.${c.name}`);
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

  db.listCollections(spec, getReadPreferenceOptions(db)).toArray(function (
    err,
    res
  ) {
    if (err) {
      if (isNotAuthorized(err) || isMongosLocalException(err)) {
        // if the error is that the user is not authorized, silently ignore it
        // and return an empty list, same for trying to listCollections on local
        // db in Mongos
        debug(
          'not allowed to run `listCollections` command on %s, returning' +
            ' empty result [].',
          db.databaseName
        );
        return done(null, []);
      }
      // the command failed for another reason, report the error
      debug('listCollections failed', err);
      err.command = 'listCollections';
      return done(err);
    }
    done(
      null,
      map(res, function (d) {
        d.db = db.databaseName;
        return parseCollection(d);
      })
    );
  });
}

function getCollections(results, done) {
  // var db = results.db;

  // concat
  let collections = [].concat
    .apply(results.listCollections, results.allowedCollections)
    .filter((f) => f.name !== '');
  // de-dupe based on _id
  collections = uniqBy(collections, (c) => c._id);

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
  const tasks = map(databases, function (_db) {
    return getDatabaseCollections.bind(null, client.db(_db.name));
  });

  async.parallel(tasks, function (err, res) {
    if (err) {
      debug('listCollections failed', err);
      return done(err);
    }
    done(null, flatten(res));
  });
}

function getHierarchy(results, done) {
  const databases = results.databases;
  const collections = groupBy(results.collections, function (collection) {
    return collection.database;
  });
  forEach(databases, function (db) {
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
    dataLake: ['build', getDataLake],

    listDatabases: ['client', 'db', 'userInfo', listDatabases],
    allowedDatabases: ['userInfo', getAllowedDatabases],
    databases: [
      'client',
      'db',
      'listDatabases',
      'allowedDatabases',
      getDatabases,
    ],

    listCollections: ['client', 'db', 'databases', listCollections],
    allowedCollections: ['userInfo', getAllowedCollections],
    collections: [
      'client',
      'db',
      'listCollections',
      'allowedCollections',
      getCollections,
    ],

    hierarchy: ['databases', 'collections', getHierarchy],

    stats: ['databases', getStats],
  };

  async.auto(tasks, function (err, results) {
    if (err) {
      // report error
      return done(err);
    }
    // cleanup
    results = omit(results, [
      'db',
      'listDatabases',
      'allowedDatabases',
      'userInfo',
      'listCollections',
      'allowedCollections',
      'cmdLineOpts',
    ]);
    return done(null, results);
  });
}

function getInstance(client, db, done) {
  getInstanceDetail(client, db, function (err, res) {
    if (err) {
      return done(err);
    }

    let port;
    let hostname;

    if (has(db, 's.options.url')) {
      debug(
        'parsing port and hostname from driver url option `%s`',
        db.s.options.url
      );
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
      if (/:\d+/.test(res.host.hostname)) {
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
  getDataLake,
  getHostInfo,
  getInstance,
  listCollections,
  listDatabases,
};
