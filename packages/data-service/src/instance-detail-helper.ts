import async from 'async';
import createDebug from 'debug';
import {
  flatten,
  forEach,
  get,
  groupBy,
  has,
  map,
  omit,
  union,
  uniqBy,
} from 'lodash';
import { Db, Document, MongoClient, ReadPreference } from 'mongodb';
import {
  BuildInfoDetails,
  Callback,
  CollectionDetails,
  DatabaseDetails,
  DatabaseStats,
  DataLakeDetails,
  ResolvedInstanceTaskData,
  GenuineMongoDBDetails,
  HostInfoDetails,
  InstanceDetails,
} from './types';

/* eslint-disable @typescript-eslint/no-var-requires */
const isNotAuthorized = require('mongodb-js-errors').isNotAuthorized;
const toNS = require('mongodb-ns');
const security = require('mongodb-security');
const getMongoDBBuildInfo = require('mongodb-build-info');
/* eslint-enable */

const debug = createDebug('mongodb-data-service:instance-detail-helper');

function getReadPreferenceOptions(db: Db) {
  // `db.command` does not use the read preference set on the
  // connection, so here we explicitly to specify it in the options.
  const readPreference = db.readPreference
    ? db.readPreference
    : ReadPreference.PRIMARY;
  return { readPreference };
}

/**
 * aggregates stats across all found databases
 * @param results   async.auto results
 * @param done      callback
 */
function getStats(
  results: Pick<ResolvedInstanceTaskData, 'databases'>,
  done: Callback<DatabaseStats>
) {
  const databases = results.databases;

  const keys: Array<keyof DatabaseStats> = [
    'document_count',
    'storage_size',
    'index_count',
    'index_size',
  ];
  const stats: DatabaseStats = {
    document_count: 0,
    storage_size: 0,
    index_count: 0,
    index_size: 0,
  };
  databases.map(function (db) {
    keys.map(function (k) {
      stats[k] += db[k];
    });
  });
  done(null, stats);
}

/**
 * @param buildInfo - Result of `db.db('admin').command({buildInfo: 1})`.
 */
function parseBuildInfo(buildInfo?: Document): BuildInfoDetails {
  buildInfo = buildInfo || {};
  return {
    version: buildInfo.version,
    commit: buildInfo.gitVersion,
    commit_url: buildInfo.gitVersion
      ? `https://github.com/mongodb/mongo/commit/${
          buildInfo.gitVersion as string
        }`
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
}

function getBuildInfo(
  results: { db: Db },
  done: Callback<BuildInfoDetails>
): void {
  const db = results.db;

  debug('checking we can get buildInfo...');
  const spec = {
    buildInfo: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  void adminDb.command(spec, getReadPreferenceOptions(db), (err, res) => {
    if (err) {
      // buildInfo doesn't require any privileges to run, so if it fails,
      // something really went wrong and we should return the error.
      debug('buildInfo failed!', err);
      (err as any).command = 'buildInfo';
      // @ts-expect-error Callback without result...
      return done(err);
    }
    done(null, parseBuildInfo(res));
  });
}

function getCmdLineOpts(results: { db: Db }, done: Callback<Document>): void {
  const db = results.db;

  const spec = {
    getCmdLineOpts: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  void adminDb.command(spec, getReadPreferenceOptions(db), (err, res) => {
    if (err) {
      debug('getCmdLineOpts failed!', err);
      return done(null, { errmsg: err.message });
    }
    done(null, res!);
  });
}

function getGenuineMongoDB(
  results: Pick<ResolvedInstanceTaskData, 'build' | 'cmdLineOpts'>,
  done: Callback<GenuineMongoDBDetails>
): void {
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

  done(null, {
    isGenuine,
    dbType: serverName,
  });
}

function getDataLake(
  results: { build: any },
  done: Callback<DataLakeDetails>
): void {
  const buildInfo = results.build.raw;

  debug('isDataLake check: buildInfo.dataLake', buildInfo.dataLake);

  const { isDataLake, dlVersion } = getMongoDBBuildInfo.getDataLake(buildInfo);

  done(null, {
    isDataLake,
    version: dlVersion,
  });
}

/**
 * @param hostInfo - Result of `db.db('admin').command({hostInfo: 1})`.
 */
function parseHostInfo(hostInfo: Document): HostInfoDetails {
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
 * @param results
 * @param done
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
function getHostInfo(
  results: { db: Db },
  done: Callback<HostInfoDetails>
): void {
  const db = results.db;

  const spec = {
    hostInfo: 1,
  };

  const adminDb = db.databaseName === 'admin' ? db : db.admin();
  void adminDb.command(spec, getReadPreferenceOptions(db), (err, res) => {
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
      (err as any).command = 'hostInfo';
      // @ts-expect-error Callback without result...
      done(err);
      return;
    }
    done(null, parseHostInfo(res!));
  });
}

function listDatabases(
  results: { db: Db; userInfo: Document },
  done: Callback<string[]>
): void {
  const db = results.db;
  const userInfo = results.userInfo;

  const cluster = security
    .getResourcesWithActions(userInfo, ['listDatabases'])
    .filter(function (resource: any) {
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
  void adminDb.command(spec, options, function (err, res) {
    if (err) {
      if (isNotAuthorized(err)) {
        // eslint-disable-next-line no-shadow
        void adminDb.command(
          { connectionStatus: 1, showPrivileges: 1 },
          options,
          function (err, res) {
            if (err) {
              // @ts-expect-error Callback without result...
              done(err);
              return;
            }
            const privileges = (res!.authInfo || {})
              .authenticatedUserPrivileges;
            if (privileges === undefined) {
              done(null, []);
              return;
            }

            done(
              null,
              privileges
                .filter(function (priv: any) {
                  // Find all named databases in priv list.
                  return ((priv.resource || {}).db || '').length > 0;
                })
                .map(function (priv: any) {
                  // Return just the names.
                  return priv.resource.db;
                })
                // eslint-disable-next-line no-shadow
                .filter(function (db: any, idx: number, arr: any[]) {
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
      (err as any).command = 'listDatabases';
      // @ts-expect-error Callback without result...
      done(err);
      return;
    }

    const names = res!.databases.map(function (d: { name: string }) {
      return d.name;
    });

    debug('listDatabases succeeded!', {
      res: JSON.stringify(res),
      names: names,
    });
    done(null, names);
  });
}

/**
 * @param client - The client.
 * @param db - The db.
 * @param name - The name.
 * @param done - The callback.

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
function getDatabase(
  client: MongoClient,
  db: Db,
  done: Callback<DatabaseDetails>
): void;
function getDatabase(
  client: MongoClient,
  db: Db,
  name: string,
  done: Callback<DatabaseDetails>
): void;
function getDatabase(
  client: MongoClient,
  db: Db,
  name: string | Callback<DatabaseDetails>,
  done?: Callback<DatabaseDetails>
): void {
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
    if (err || !res) {
      debug('dbStats failed. Falling back to no stats.');
      res = {};
    } else {
      debug('got dbStats for `%s`', name, res);
    }
    const dbName = res.db || name;
    const details: DatabaseDetails = {
      _id: dbName,
      name: dbName,
      document_count: res.objects || 0,
      storage_size: res.storageSize || 0,
      index_count: res.indexes || 0,
      index_size: res.indexSize || 0,
    };
    done?.(null, details);
  });
}

function getDatabases(
  results: {
    client: MongoClient;
    db: Db;
    listDatabases: string[];
    allowedDatabases: string[];
  },
  done: Callback<DatabaseDetails[]>
): void {
  const db = results.db;
  const client = results.client;

  // merge and de-dupe databases
  const dbnames = union(results.listDatabases, results.allowedDatabases);

  async.parallel(
    dbnames.map((name) => {
      return (done) => {
        getDatabase(client, db, name, done as any);
      };
    }),
    done as any
  );
}

function getUserInfo(results: { db: Db }, done: Callback<Document>): void {
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
        // @ts-expect-error Callback without result...
        return done(err);
      }
      if (
        !has(res, 'authInfo.authenticatedUsers') ||
        !res!.authInfo.authenticatedUsers[0]
      ) {
        debug('no logged in user, returning empty document');
        return done(null, {});
      }
      const user = res!.authInfo.authenticatedUsers[0];

      db.command(
        { usersInfo: user, showPrivileges: true },
        options,
        function (_err, _res) {
          if (_err) {
            // @durran: For the case usersInfo cannot be retrieved.
            debug(
              `Command "usersInfo" could not be retrieved: ${
                _err?.message || '<no result>'
              }`
            );
            return done(null, {});
          }
          // For the case azure cosmosDB bug
          done(null, _res!.users[0] || {});
        }
      );
    }
  );
}

function getAllowedDatabases(
  results: { userInfo: any },
  done: Callback<string[]>
): void {
  const userInfo = results.userInfo;

  // get databases on which the user is allowed to call listCollections
  let databases = security
    .getResourcesWithActions(userInfo, ['listCollections'])
    .map(function (resource: { db: string }) {
      return resource.db;
    });
  databases = databases.concat(
    security
      .getResourcesWithActions(userInfo, ['find'])
      .map(function (resource: { db: string }) {
        return resource.db;
      })
  );

  done(
    null,
    databases.filter((f: string, i: number) => f && databases.indexOf(f) === i)
  );
}
function parseCollection(
  resp: Document & { db: string; name: string }
): CollectionDetails {
  const ns = toNS(`${resp.db}.${resp.name}`);
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

function getAllowedCollections(
  results: { userInfo: Document },
  done: Callback<CollectionDetails[]>
): void {
  type DbAndCollection = { db: string; collection: string };
  type DbAndName = { db: string; name: string };
  const userInfo = results.userInfo;

  // get collections on which the user is allowed to call find and collStats
  const compassActions = ['find', 'collStats'];
  let collections: DbAndName[] = security
    .getResourcesWithActions(userInfo, compassActions)
    .map(function (resource: DbAndCollection) {
      return {
        db: resource.db,
        name: resource.collection,
      };
    });
  collections = collections
    .concat(
      security
        .getResourcesWithActions(userInfo, ['find'])
        .map(function (resource: DbAndCollection) {
          return {
            db: resource.db,
            name: resource.collection,
          };
        })
    )
    .filter((f: DbAndName) => f.name);

  collections = uniqBy(collections, (c) => `${c.db}.${c.name}`);
  const collDetails = map(collections, parseCollection);
  debug('allowed collections', collDetails);
  done(null, collDetails);
}

function isMongosLocalException(err?: any): boolean {
  if (!err) {
    return false;
  }
  const msg = err.message || err.err || JSON.stringify(err);
  return new RegExp('database through mongos').test(msg);
}

function getDatabaseCollections(
  db: Db,
  done: Callback<CollectionDetails[]>
): void {
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
      (err as any).command = 'listCollections';
      // @ts-expect-error Callback without result...
      return done(err);
    }
    done(
      null,
      map(res, function (d) {
        return parseCollection({
          ...d,
          db: db.databaseName,
        });
      })
    );
  });
}

function getCollections(
  results: Pick<
    ResolvedInstanceTaskData,
    'listCollections' | 'allowedCollections'
  >,
  done: Callback<CollectionDetails[]>
) {
  // var db = results.db;

  // concat
  let collections = [
    ...results.listCollections,
    ...results.allowedCollections,
  ].filter((f) => f.name !== '');
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

function listCollections(
  results: { client: MongoClient; databases: DatabaseDetails[] },
  done: Callback<CollectionDetails[]>
): void {
  const client = results.client;
  const databases = results.databases;

  // merge and de-dupe databases
  const tasks = databases.map(function (_db) {
    return getDatabaseCollections.bind(null, client.db(_db.name));
  });

  async.parallel(tasks as any, function (err, res) {
    if (err) {
      debug('listCollections failed', err);
      // @ts-expect-error Callback without result...
      return done(err);
    }
    done(null, flatten(res) as CollectionDetails[]);
  });
}

function getHierarchy(
  results: { databases: DatabaseDetails[]; collections: CollectionDetails[] },
  done: Callback<void>
): void {
  const databases = results.databases;
  const collections = groupBy(results.collections, function (collection) {
    return collection.database;
  });
  forEach(databases, function (db) {
    db.collections = collections[db.name] || [];
  });
  done(null);
}

function attach<T>(
  anything: T,
  done: (ignored: unknown, value: T) => void
): void {
  done(null, anything);
}
/**
 * Retrieves many instance details, such as the build and host info,
 * databases and collections which the user has access to.
 *
 * @param client - The client.
 * @param db - database handle from the node driver
 * @param done - callback
 */
function getInstanceDetail(
  client: MongoClient,
  db: Db,
  done: Callback<InstanceDetails>
): void {
  const tasks: Record<keyof ResolvedInstanceTaskData, any> = {
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
      // @ts-expect-error Callback without result...
      return done(err);
    }
    // cleanup
    const cleanedResult = omit(results, [
      'db',
      'listDatabases',
      'allowedDatabases',
      'userInfo',
      'listCollections',
      'allowedCollections',
      'cmdLineOpts',
    ]) as unknown as InstanceDetails;
    return done(null, cleanedResult);
  });
}

function getInstance(
  client: MongoClient,
  db: Db,
  done: Callback<InstanceDetails>
): void {
  getInstanceDetail(client, db, function (err, res) {
    if (err) {
      // @ts-expect-error Callback without result...
      return done(err);
    }

    debug('instance.get returning', res);
    done(null, res);
  } as Callback<InstanceDetails>);
}

export {
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
