import { AnyError, MongoClient, Document } from 'mongodb';
import {
  isEnterprise,
  getGenuineMongoDB,
  getDataLake,
} from 'mongodb-build-info';
import toNS from 'mongodb-ns';
import createLogger from '@mongodb-js/compass-logging';

import {
  BuildInfo,
  CmdLineOpts,
  Collection,
  CollectionNameOnly,
  ConnectionStatusWithPriveleges,
  DatabaseNameOnly,
  DbStats,
  HostInfo,
  ListDatabasesResult,
  runCommand,
} from './run-command';

const { debug } = createLogger('COMPASS-CONNECT');

type BuildInfoDetails = {
  isEnterprise: boolean;
  version: string;
};

type HostInfoDetails = {
  arch?: string;
  // This is the only value that is used outside the metrics in
  // compass-serverstats plugin
  cpu_cores?: number;
  cpu_frequency?: number;
  memory_bits?: number;
  os?: string;
  os_family?: string;
  kernel_version?: string;
  kernel_version_string?: string;
};

type GenuineMongoDBDetails = {
  isGenuine: boolean;
  dbType: string;
};

type DataLakeDetails = {
  isDataLake: boolean;
  version: string | null;
};

type CollectionDetails = {
  _id: string;
  name: string;
  database: string;
  type: string;
  readonly: boolean;
  collation: Document | null;
  view_on: string | null;
  pipeline: Document[] | null;
};

type DatabaseDetails = {
  _id: string;
  name: string;
  document_count: number;
  storage_size: number;
  index_count: number;
  index_size: number;
  collections: CollectionDetails[];
};

export type InstanceDetails = {
  build: BuildInfoDetails;
  host: HostInfoDetails;
  genuineMongoDB: GenuineMongoDBDetails;
  dataLake: DataLakeDetails;
  databases: DatabaseDetails[];
  featureCompatibilityVersion: string | null;
};

export async function getInstance(
  client: MongoClient
): Promise<InstanceDetails> {
  const adminDb = client.db('admin');

  const [
    connectionStatus,
    getCmdLineOptsResult,
    hostInfoResult,
    buildInfoResult,
    listDatabasesResult,
    getParameterResult,
  ] = await Promise.all([
    runCommand(adminDb, { connectionStatus: 1, showPrivileges: true }).catch(
      ignoreNotAuthorized(null)
    ),
    runCommand(adminDb, { getCmdLineOpts: 1 }).catch((err) => {
      /**
       * This is something that mongodb-build-info uses to detect some
       * "non-genuine" mongodb instances like cosmosdb or documentdb
       *
       * @see https://github.com/mongodb-js/mongodb-build-info/blob/a8b4c22b46e271dfcb0a620d19afc5a7c7df3d8f/index.js#L64-L70
       */
      return { errmsg: err.message };
    }),
    runCommand(adminDb, { hostInfo: 1 }).catch(ignoreNotAuthorized({})),
    // This command should always pass, if it throws, somethings is really off.
    // This is why it's the only one where we are not ignoring any types of
    // errors
    runCommand(adminDb, { buildInfo: 1 }),
    runCommand(adminDb, { listDatabases: 1, nameOnly: true }).catch(
      ignoreNotAuthorized(null)
    ),
    // This command is only here to get data for the logs and telemetry, if it
    // failed (e.g., not authorised or not supported) we should just ignore the
    // failure
    runCommand<{ featureCompatibilityVersion: { version: string } }>(adminDb, {
      getParameter: 1,
      featureCompatibilityVersion: 1,
    }).catch(() => null),
  ]);

  const databases = await fetchDatabases(
    client,
    connectionStatus,
    listDatabasesResult
  );

  return {
    build: adaptBuildInfo(buildInfoResult),
    host: adaptHostInfo(hostInfoResult),
    genuineMongoDB: buildGenuineMongoDBInfo(
      buildInfoResult,
      getCmdLineOptsResult
    ),
    dataLake: buildDataLakeInfo(buildInfoResult),
    featureCompatibilityVersion:
      getParameterResult?.featureCompatibilityVersion.version ?? null,
    databases: databases,
  };
}

function buildGenuineMongoDBInfo(
  buildInfo: Partial<BuildInfo>,
  cmdLineOpts: Partial<CmdLineOpts & { errmsg: string }>
): GenuineMongoDBDetails {
  const { isGenuine, serverName } = getGenuineMongoDB(buildInfo, cmdLineOpts);

  return {
    isGenuine,
    dbType: serverName,
  };
}

function buildDataLakeInfo(buildInfo: Partial<BuildInfo>): DataLakeDetails {
  const { isDataLake, dlVersion } = getDataLake(buildInfo);

  return {
    isDataLake,
    version: dlVersion,
  };
}

async function fetchDatabases(
  client: MongoClient,
  connectionStatus: ConnectionStatusWithPriveleges | null,
  listDatabaseCommandResult: ListDatabasesResult<DatabaseNameOnly> | null
) {
  const privileges = extractPrivilegesByDatabaseAndCollection(
    connectionStatus,
    ['find']
  );

  const listedDatabaseNames =
    listDatabaseCommandResult?.databases.map((db) => db.name) ?? [];

  // We pull in the database names listed among the user privileges. This
  // accounts for situations where a user would not have rights to listDatabases
  // on the cluster but is authorized to perform actions on specific databases.
  const privilegesDatabaseNames = Object.keys(privileges);

  const uniqueDbNames = Array.from(
    new Set([...listedDatabaseNames, ...privilegesDatabaseNames])
  ).filter(Boolean);

  const databases = (
    await Promise.all(
      uniqueDbNames.map((name) =>
        fetchDatabaseWithCollections(client, name, privileges)
      )
    )
  )
    .filter(Boolean)
    .filter(({ name }) => name);

  return databases;
}

type DatabaseCollectionPrivileges = Record<string, Record<string, string[]>>;

function extractPrivilegesByDatabaseAndCollection(
  connectionStatus: ConnectionStatusWithPriveleges | null,
  requiredActions: string[] | null = null
): DatabaseCollectionPrivileges {
  const privileges =
    connectionStatus?.authInfo?.authenticatedUserPrivileges ?? [];

  return Object.fromEntries(
    privileges
      .filter(({ resource: { db, collection }, actions }) => {
        return (
          db &&
          collection &&
          (requiredActions
            ? requiredActions.every((action) => actions.includes(action))
            : true)
        );
      })
      .map(({ resource: { db, collection }, actions }) => {
        return [db, { [collection]: actions }];
      })
  );
}

async function fetchDatabaseWithCollections(
  client: MongoClient,
  dbName: string,
  privileges: DatabaseCollectionPrivileges = {}
) {
  const db = client.db(dbName);

  const [database, rawCollections] = await Promise.all([
    runCommand(db, { dbStats: 1 })
      .catch(ignoreNotAuthorized({ db: dbName }))
      .then(adaptDatabaseInfo),

    (
      db
        .listCollections()
        // Convincing TypeScript to use correct types, otherwise it picks up
        // driver ones that are a bit too loose
        .toArray() as Promise<Collection[]>
    )
      .catch(ignoreNotAuthorized([] as Collection[]))
      .catch(ignoreMongosLocalException([] as Collection[])),
  ]);

  const listedCollections = rawCollections.map((rawCollection) => ({
    db: dbName,
    ...rawCollection,
  }));

  const collectionsFromPrivileges = Object.keys(privileges[dbName] || {})
    .filter((name) => name && !isSystemCollection(name))
    .map((name) => ({
      name,
      db: dbName,
      // We don't know any better when getting data from privileges. Collection
      // is a safe default
      type: 'collection' as const,
    }));

  const collections = Object.fromEntries(
    // NB: Order is important, whatever is the last item in the list will take
    // precedence, we want it to be collection info from listCollections, not
    // from privileges
    [...collectionsFromPrivileges, ...listedCollections].map((coll) => [
      coll.name,
      adaptCollectionInfo(coll),
    ])
  );

  return {
    ...database,
    collections: Array.from(Object.values(collections)),
  };
}

function isSystemCollection(name: string) {
  return name.startsWith('system.');
}

function isNotAuthorized(err: AnyError) {
  if (!err) {
    return false;
  }
  const msg = err.message || JSON.stringify(err);
  return new RegExp('not (authorized|allowed)').test(msg);
}

function isMongosLocalException(err: AnyError) {
  if (!err) {
    return false;
  }
  const msg = err.message || JSON.stringify(err);
  return new RegExp('database through mongos').test(msg);
}

function ignoreNotAuthorized<T>(fallback: T): (err: AnyError) => Promise<T> {
  return (err: AnyError) => {
    if (isNotAuthorized(err)) {
      debug('ignoring not authorized error and returning fallback value:', {
        err,
        fallback,
      });
      return Promise.resolve(fallback);
    }

    return Promise.reject(err);
  };
}

function ignoreMongosLocalException<T>(
  fallback: T
): (err: AnyError) => Promise<T> {
  return (err: AnyError) => {
    if (isMongosLocalException(err)) {
      debug(
        'ignoring mongos action on local db error and returning fallback value:',
        {
          err,
          fallback,
        }
      );
      return Promise.resolve(fallback);
    }

    return Promise.reject(err);
  };
}

function adaptHostInfo(rawHostInfo: Partial<HostInfo>): HostInfoDetails {
  return {
    os: rawHostInfo.os?.name,
    os_family: rawHostInfo.os?.type
      ? rawHostInfo.os.type.toLowerCase()
      : undefined,
    kernel_version: rawHostInfo.os?.version,
    kernel_version_string: rawHostInfo.extra?.versionString,
    arch: rawHostInfo.system?.cpuArch,
    memory_bits: (rawHostInfo.system?.memSizeMB ?? 0) * 1024 * 1024,
    cpu_cores: rawHostInfo.system?.numCores,
    cpu_frequency:
      parseInt(rawHostInfo.extra?.cpuFrequencyMHz || '0', 10) * 1_000_000,
  };
}

function adaptBuildInfo(rawBuildInfo: Partial<BuildInfo>) {
  return {
    version: rawBuildInfo.version ?? '',
    // Cover both cases of detecting enterprise module, see SERVER-18099.
    isEnterprise: isEnterprise(rawBuildInfo),
  };
}

function adaptDatabaseInfo(
  databaseStats: Pick<DbStats, 'db'> & Partial<DbStats>
): Omit<DatabaseDetails, 'collections'> {
  return {
    _id: databaseStats.db,
    name: databaseStats.db,
    document_count: databaseStats.objects ?? 0,
    storage_size: databaseStats.storageSize ?? 0,
    index_count: databaseStats.indexes ?? 0,
    index_size: databaseStats.indexSize ?? 0,
  };
}

function adaptCollectionInfo({
  db,
  name,
  info,
  options,
  type,
}: CollectionNameOnly &
  Partial<Collection> & { db: string }): CollectionDetails {
  const ns = toNS(`${db}.${name}`);
  return {
    _id: ns.toString(),
    name: ns.collection,
    database: ns.database,
    type,
    readonly: info?.readOnly ?? false,
    collation: options?.collation ?? null,
    view_on: options?.viewOn ?? null,
    pipeline: options?.pipeline ?? null,
  };
}
