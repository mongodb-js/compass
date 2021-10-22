import type { Document, Db, RunCommandOptions } from 'mongodb';
import type { UUID } from 'bson';

export type ConnectionStatus = {
  authInfo: {
    authenticatedUsers: { user: string; db: string }[];
    authenticatedUserRoles: { role: string; db: string }[];
  };
};

export type ConnectionStatusWithPriveleges = ConnectionStatus & {
  authInfo: {
    authenticatedUserPrivileges: {
      resource: { db: string; collection: string };
      actions: string[];
    }[];
  };
};

export type CmdLineOpts = {
  argv: string[];
  parsed: unknown;
};

export type HostInfo = {
  system: {
    currentTime: Date;
    hostname: string;
    cpuAddrSize: number;
    memSizeMB: number;
    // Available starting in MongoDB 4.0.9 (and 3.6.13)
    memLimitMB?: number;
    numCores: number;
    cpuArch: string;
    numaEnabled: boolean;
  };
  os: {
    type: string;
    name: string;
    version: string;
  };
  extra: {
    versionString: string;
    libcVersion: string;
    kernelVersion: string;
    cpuFrequencyMHz: string;
    cpuFeatures: string;
    pageSize: number;
    numPages: number;
    maxOpenFiles: number;
  };
};

export type BuildInfo = {
  version: string;
  gitVersion: string;
  loaderFlags: string;
  compilerFlags: string;
  versionArray: number[];
  openssl: unknown;
  javascriptEngine: string;
  bits: number;
  debug: boolean;
  maxBsonObjectSize: number;
  storageEngines: string[];
  /**
   * @unstable
   * @deprecated
   */
  sysInfo: 'deprecated';
  /** @unstable */
  allocator: string;
  /** @unstable */
  buildEnvironment: unknown;
};

export type DbStats = {
  db: string;
  collections: number;
  views: number;
  objects: number;
  avgObjSize: number;
  dataSize: number;
  storageSize: number;
  numExtents: number;
  indexes: number;
  indexSize: number;
  scaleFactor: number;
  fsUsedSize: number;
  fsTotalSize: number;
};

interface RunDiagnosticsCommand {
  (
    db: Db,
    spec: { connectionStatus: 1; showPrivileges?: never },
    options?: RunCommandOptions
  ): Promise<ConnectionStatus>;
  (
    db: Db,
    spec: { connectionStatus: 1; showPrivileges: true },
    options?: RunCommandOptions
  ): Promise<ConnectionStatusWithPriveleges>;
  (
    db: Db,
    spec: { getCmdLineOpts: 1 },
    options?: RunCommandOptions
  ): Promise<CmdLineOpts>;
  (
    db: Db,
    spec: { hostInfo: 1 },
    options?: RunCommandOptions
  ): Promise<HostInfo>;
  (
    db: Db,
    spec: { buildInfo: 1 },
    options?: RunCommandOptions
  ): Promise<BuildInfo>;
  (
    db: Db,
    spec: { dbStats: 1; scale?: number },
    options?: RunCommandOptions
  ): Promise<DbStats>;
}

export type ListDatabasesOptions = {
  nameOnly?: never;
  filter?: {
    name: unknown;
    sizeOnDisk: unknown;
    empty: unknown;
    shards: unknown;
  };
  authorizedDatabases?: boolean;
  comment?: string;
};

export type ListDatabasesOptionsNamesOnly = Omit<
  ListDatabasesOptions,
  'nameOnly'
> & {
  nameOnly: true;
};

export type DatabaseNameOnly = { name: string };

export type Database = DatabaseNameOnly & {
  sizeOnDisk: number;
  empty: boolean;
};

export type ListDatabasesResult<DatabaseType> = DatabaseType extends Database
  ? { databases: DatabaseType[]; totalSize: number; totalSizeMb: number }
  : { databases: DatabaseType[] };

export type CollectionNameOnly = {
  name: string;
  type: 'collection' | 'view' | 'timeseries';
};

export type Collection = CollectionNameOnly & {
  /** @see https://docs.mongodb.com/manual/reference/method/db.createCollection/#mongodb-method-db.createCollection */
  options: Document;
  info: {
    readOnly: boolean;
    uuid?: UUID;
  };
  idIndex?: Document;
};

export type ListCollectionsOptions = {
  nameOnly?: never;
  filter?: Document;
  authorizedCollections?: boolean;
  comment?: string;
};

export type ListCollectionsOptionsNamesOnly = Omit<
  ListCollectionsOptions,
  'nameOnly'
> & {
  nameOnly: true;
};

export type ListCollectionsResult<CollectionType> = {
  cursor: { firstBatch: CollectionType };
};

interface RunAdministrationCommand {
  <Parameters extends Record<string, unknown>>(
    db: Db,
    spec: { getParameter: 1; comment?: string } & Record<
      keyof Parameters,
      unknown
    >,
    options?: RunCommandOptions
  ): Promise<Omit<Parameters, 'getParameter' | 'comment'>>;
  <
    Parameters extends Record<string, unknown>,
    Options = Record<string, unknown>
  >(
    db: Db,
    spec: { getParameter: '*'; comment?: string } & Options,
    options?: RunCommandOptions
  ): Promise<Omit<Parameters, keyof Options>>;
  (
    db: Db,
    spec: { listDatabases: 1 } & ListDatabasesOptions,
    options?: RunCommandOptions
  ): Promise<ListDatabasesResult<Database>>;
  (
    db: Db,
    spec: { listDatabases: 1 } & ListDatabasesOptionsNamesOnly,
    options?: RunCommandOptions
  ): Promise<ListDatabasesResult<DatabaseNameOnly>>;
  (
    db: Db,
    spec: { listCollections: 1 } & ListCollectionsOptions,
    options?: RunCommandOptions
  ): Promise<ListCollectionsResult<Collection>>;
  (
    db: Db,
    spec: { listCollections: 1 } & ListCollectionsOptionsNamesOnly,
    options?: RunCommandOptions
  ): Promise<ListCollectionsResult<CollectionNameOnly>>;
}

interface RunCommand extends RunDiagnosticsCommand, RunAdministrationCommand {}

/**
 * Runs command against provided database using db.command. Provides a better
 * return type based on provided command spec
 *
 * @param db database to run command against
 * @param spec command name in the format { <command name>: 1 }
 * @param options command options
 * @returns command result
 */
export const runCommand: RunCommand = (
  db: Db,
  spec: Document,
  options?: RunCommandOptions
) => {
  return db.command(
    { ...spec, ...options },
    options as RunCommandOptions
    // It's pretty hard to convince TypeScript that we are doing the right thing
    // here due to how vague the driver types are hence the `any` assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as any;
};
