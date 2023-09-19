import type {
  AnyError,
  MongoClient,
  Document,
  MongoClientOptions,
  AutoEncryptionOptions,
} from 'mongodb';
import {
  isEnterprise,
  getGenuineMongoDB,
  getDataLake,
  isAtlas as checkIsAtlas,
  isLocalAtlas as checkIsLocalAtlas,
} from 'mongodb-build-info';
import toNS from 'mongodb-ns';

import type {
  BuildInfo,
  CollectionInfo,
  CollectionInfoNameOnly,
  ConnectionStatusWithPrivileges,
  DatabaseInfo,
  DbStats,
  HostInfo,
} from './run-command';
import { runCommand } from './run-command';
import { debug } from './logger';

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
  clustered: boolean;
  collation: Document | null;
  view_on: string | null;
  fle2: boolean;
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
  collection_count: number;
  document_count: number;
  storage_size: number;
  data_size: number;
  index_count: number;
  index_size: number;
  collections: CollectionDetails[];
};

export type InstanceDetails = {
  auth: {
    user:
      | ConnectionStatusWithPrivileges['authInfo']['authenticatedUsers'][number]
      | null;
    roles: ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles'];
    privileges: ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges'];
  };
  build: BuildInfoDetails;
  host: HostInfoDetails;
  genuineMongoDB: GenuineMongoDBDetails;
  dataLake: DataLakeDetails;
  featureCompatibilityVersion: string | null;
  isAtlas: boolean;
  isLocalAtlas: boolean;
  csfleMode: 'enabled' | 'disabled' | 'unavailable';
};

export async function getInstance(
  client: MongoClient,
  uri: string
): Promise<Omit<InstanceDetails, 'csfleMode'>> {
  const adminDb = client.db('admin');
  const [
    connectionStatus,
    hostInfoResult,
    buildInfoResult,
    getParameterResult,
    atlasVersionResult,
    isLocalAtlas,
  ] = await Promise.all([
    runCommand(adminDb, { connectionStatus: 1, showPrivileges: true }).catch(
      ignoreNotAuthorized(null)
    ),
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
    runCommand(adminDb, { atlasVersion: 1 }).catch(() => {
      return { atlasVersion: '', gitVersion: '' };
    }),
    checkIsLocalAtlas(
      async (db: string, collection: string, query: Document) => {
        return await client.db(db).collection(collection).countDocuments(query);
      }
    ),
  ]);

  const isAtlas = !!atlasVersionResult.atlasVersion || checkIsAtlas(uri);

  return {
    auth: adaptAuthInfo(connectionStatus),
    build: adaptBuildInfo(buildInfoResult),
    host: adaptHostInfo(hostInfoResult),
    genuineMongoDB: buildGenuineMongoDBInfo(uri),
    dataLake: buildDataLakeInfo(buildInfoResult),
    featureCompatibilityVersion:
      getParameterResult?.featureCompatibilityVersion.version ?? null,
    isAtlas,
    // If a user is connected to Cloud Atlas, its possible they can have
    // admin.atlascli with data that mongo-build-info uses to check for
    // local atlas. So we set isLocalAtlas to false in such cases.
    isLocalAtlas: isAtlas ? false : isLocalAtlas,
  };
}

export function checkIsCSFLEConnection(client: {
  options: MongoClientOptions;
}): boolean {
  return configuredKMSProviders(client.options?.autoEncryption).length > 0;
}

export function configuredKMSProviders(
  autoEncryption?: AutoEncryptionOptions
): (keyof NonNullable<AutoEncryptionOptions['kmsProviders']>)[] {
  const kmsProviders = autoEncryption?.kmsProviders ?? {};
  return Object.entries(kmsProviders)
    .filter(
      ([, kmsOptions]) =>
        Object.values(kmsOptions ?? {}).filter(Boolean).length > 0
    )
    .map(([kmsProviderName]) => kmsProviderName as any);
}

function buildGenuineMongoDBInfo(uri: string): GenuineMongoDBDetails {
  const { isGenuine, serverName } = getGenuineMongoDB(uri);

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

function adaptAuthInfo(
  connectionStatus: ConnectionStatusWithPrivileges | null
) {
  if (connectionStatus === null) {
    return { user: null, roles: [], privileges: [] };
  }

  const {
    authenticatedUsers,
    authenticatedUserRoles,
    authenticatedUserPrivileges,
  } = connectionStatus.authInfo;

  return {
    user: authenticatedUsers[0] ?? null,
    roles: authenticatedUserRoles,
    privileges: authenticatedUserPrivileges,
  };
}

type DatabaseCollectionPrivileges = Record<string, Record<string, string[]>>;

export function getPrivilegesByDatabaseAndCollection(
  authenticatedUserPrivileges:
    | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserPrivileges']
    | null = null,
  requiredActions: string[] | null = null
): DatabaseCollectionPrivileges {
  const privileges = authenticatedUserPrivileges ?? [];

  const filteredPrivileges =
    requiredActions && requiredActions.length > 0
      ? privileges.filter(({ actions }) => {
          return requiredActions.every((action) => actions.includes(action));
        })
      : privileges;

  const result: DatabaseCollectionPrivileges = {};

  for (const { resource, actions } of filteredPrivileges) {
    // Documented resources include roles for dbs/colls, cluster, or in rare cases
    // anyResource, additionally there seem to be undocumented ones like
    // system_buckets and who knows what else. To make sure we are only cover
    // cases that we can meaningfully handle here, roles for the
    // databases/collections, we are skipping all roles where these are
    // undefined
    //
    // See: https://docs.mongodb.com/manual/reference/resource-document/#std-label-resource-document
    if (
      typeof resource.db !== 'undefined' &&
      typeof resource.collection !== 'undefined'
    ) {
      const { db, collection } = resource;

      if (result[db]) {
        Object.assign(result[db], { [collection]: actions });
      } else {
        result[db] = { [collection]: actions };
      }
    }
  }

  return result;
}

// Return a list of the databases which have a role matching one of the roles.
export function getDatabasesByRoles(
  authenticatedUserRoles:
    | ConnectionStatusWithPrivileges['authInfo']['authenticatedUserRoles']
    | null = null,
  possibleRoles: string[] | null = null
): string[] {
  const roles = authenticatedUserRoles ?? [];

  const results = new Set<string>();

  const filteredRoles =
    possibleRoles && possibleRoles.length > 0
      ? roles.filter(({ role }) => {
          return possibleRoles.includes(role);
        })
      : roles;

  for (const { db } of filteredRoles) {
    results.add(db);
  }

  return [...results];
}

export function isNotAuthorized(err: any) {
  if (!err) {
    return false;
  }
  const msg = (err as Error).message || JSON.stringify(err);
  return new RegExp('not (authorized|allowed)').test(msg);
}

export function isNotSupportedPipelineStage(err: any) {
  if (!err) {
    return false;
  }
  const msg = (err as Error).message || JSON.stringify(err);
  return msg.match(/Unrecognized pipeline stage name/);
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
  databaseStats: Partial<DbStats> & Partial<DatabaseInfo>
): Omit<DatabaseDetails, '_id' | 'collections' | 'name'> {
  return {
    collection_count: databaseStats.collections ?? 0,
    document_count: databaseStats.objects ?? 0,
    index_count: databaseStats.indexes ?? 0,
    storage_size: databaseStats.storageSize ?? 0,
    data_size: databaseStats.dataSize ?? 0,
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
    clusteredIndex,
    encryptedFields,
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
    clustered: clusteredIndex ? true : false,
    fle2: encryptedFields ? true : false,
    validation: hasValidation
      ? { validator, validationAction, validationLevel }
      : null,
  };
}
