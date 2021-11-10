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
  CollectionInfo,
  CollectionInfoNameOnly,
  ConnectionStatusWithPriveleges,
  DatabaseInfo,
  DbStats,
  HostInfo,
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
  system: boolean;
  oplog: boolean;
  command: boolean;
  special: boolean;
  specialish: boolean;
  normal: boolean;
  readonly: boolean;
  collation: Document | null;
  view_on: string | null;
  pipeline: Document[] | null;
  validation: {
    validator: Document;
    validationAction: string;
    validationLevel: string;
  } | null;
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
  featureCompatibilityVersion: string | null;
};

export async function getInstance(
  client: MongoClient
): Promise<InstanceDetails> {
  const adminDb = client.db('admin');

  const [
    getCmdLineOptsResult,
    hostInfoResult,
    buildInfoResult,
    getParameterResult,
  ] = await Promise.all([
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
    // This command is only here to get data for the logs and telemetry, if it
    // failed (e.g., not authorised or not supported) we should just ignore the
    // failure
    runCommand<{ featureCompatibilityVersion: { version: string } }>(adminDb, {
      getParameter: 1,
      featureCompatibilityVersion: 1,
    }).catch(() => null),
  ]);

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

type DatabaseCollectionPrivileges = Record<string, Record<string, string[]>>;

export function extractPrivilegesByDatabaseAndCollection(
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

type DatabasesAndCollectionsNames = {
  databases: string[];
  collections: string[];
};

export async function getDatabasesAndCollectionsFromPrivileges(
  client: MongoClient,
  requiredActions: string[] | null = null
): Promise<DatabasesAndCollectionsNames> {
  const adminDb = client.db('admin');
  const connectionStatus = await runCommand(adminDb, {
    connectionStatus: 1,
    showPrivileges: true,
  }).catch(ignoreNotAuthorized(null));

  const result: DatabasesAndCollectionsNames = {
    databases: [],
    collections: [],
  };

  if (connectionStatus) {
    const privileges = extractPrivilegesByDatabaseAndCollection(
      connectionStatus,
      requiredActions
    );

    result.databases = Object.keys(privileges);

    result.collections = Object.values(privileges)
      .map((collections) => Object.keys(collections))
      .flat();
  }

  return result;
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

export function adaptDatabaseInfo(
  databaseStats: { db: string } & Partial<DbStats> & Partial<DatabaseInfo>
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

export function adaptCollectionInfo({
  db,
  name,
  info,
  options,
  type,
}: CollectionInfoNameOnly &
  Partial<CollectionInfo> & { db: string }): CollectionDetails {
  const ns = toNS(`${db}.${name}`);
  const {
    collection,
    database,
    system,
    oplog,
    command,
    special,
    specialish,
    normal,
  } = ns;
  const { readOnly } = info ?? {};
  const {
    collation,
    viewOn,
    pipeline,
    validator,
    validationAction,
    validationLevel,
  } = options ?? {};

  const hasValidation = Boolean(
    validator || validationAction || validationLevel
  );

  return {
    _id: ns.toString(),
    name: collection,
    database,
    system,
    oplog,
    command,
    special,
    specialish,
    normal,
    type: type ?? 'collection',
    readonly: readOnly ?? false,
    collation: collation ?? null,
    view_on: viewOn ?? null,
    pipeline: pipeline ?? null,
    validation: hasValidation
      ? { validator, validationAction, validationLevel }
      : null,
  };
}
