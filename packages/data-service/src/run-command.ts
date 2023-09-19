import type { Document, Db, RunCommandOptions, ServerSessionId } from 'mongodb';
import { ReadPreference } from 'mongodb';
import type { Binary } from 'bson';

export type ConnectionStatus = {
  authInfo: {
    authenticatedUsers: { user: string; db: string }[];
    authenticatedUserRoles: { role: string; db: string }[];
  };
};

export type ConnectionStatusWithPrivileges = ConnectionStatus & {
  authInfo: {
    authenticatedUserPrivileges: {
      resource:
        | { db?: never; collection?: never; cluster: true; anyResource?: never }
        | {
            db: string;
            collection: string;
            cluster?: never;
            anyResource?: never;
          }
        | {
            db?: never;
            collection?: never;
            cluster?: never;
            anyResource: true;
          };
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

/**
 * @see {@link https://www.mongodb.com/docs/manual/reference/command/nav-diagnostic/}
 */
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
  ): Promise<ConnectionStatusWithPrivileges>;
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
  (
    db: Db,
    spec: { atlasVersion: 1 },
    options?: RunCommandOptions
  ): Promise<AtlasVersionInfo>;
  (db: Db, spec: { ping: 1 }, options?: RunCommandOptions): Promise<unknown>;
  (
    db: Db,
    spec: { serverStatus: 1 },
    options?: RunCommandOptions
  ): Promise<Document>;
  (db: Db, spec: { top: 1 }, options?: RunCommandOptions): Promise<{
    totals: Record<string, unknown>;
  }>;
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

export type DatabaseInfoNameOnly = { name: string };

export type DatabaseInfo = DatabaseInfoNameOnly & {
  sizeOnDisk: number;
  empty: boolean;
};

export type ListDatabasesResult<DatabaseType> =
  DatabaseType extends DatabaseInfo
    ? { databases: DatabaseType[]; totalSize: number; totalSizeMb: number }
    : { databases: DatabaseType[] };

export type CollectionInfoNameOnly = {
  name: string;
  type?: 'collection' | 'view' | 'timeseries' | string;
};

export type CollectionInfo = CollectionInfoNameOnly & {
  /** @see https://docs.mongodb.com/manual/reference/method/db.createCollection/#mongodb-method-db.createCollection */
  options: Document;
  info: {
    readOnly?: boolean;
    uuid?: Binary;
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

export type AtlasVersionInfo = {
  atlasVersion: string;
  gitVersion: string;
};

export type ListCollectionsResult<CollectionType> = {
  cursor: { firstBatch: CollectionType };
};

/**
 * @see {@link https://www.mongodb.com/docs/manual/reference/command/nav-administration/}
 */
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
  ): Promise<ListDatabasesResult<DatabaseInfo>>;
  (
    db: Db,
    spec: { listDatabases: 1 } & ListDatabasesOptionsNamesOnly,
    options?: RunCommandOptions
  ): Promise<ListDatabasesResult<DatabaseInfoNameOnly>>;
  (
    db: Db,
    spec: { listCollections: 1 } & ListCollectionsOptions,
    options?: RunCommandOptions
  ): Promise<ListCollectionsResult<CollectionInfo>>;
  (
    db: Db,
    spec: { listCollections: 1 } & ListCollectionsOptionsNamesOnly,
    options?: RunCommandOptions
  ): Promise<ListCollectionsResult<CollectionInfoNameOnly>>;
  (
    db: Db,
    spec: { killOp: 1; id: number; comment?: string },
    options?: RunCommandOptions
  ): Promise<{ info: string; ok: 1 }>;
  (
    db: Db,
    spec: { currentOp: 1; $all?: boolean },
    options?: RunCommandOptions
  ): Promise<{ inprog: Array<Document> }>;
  (
    db: Db,
    spec: { collMod: string; [flags: string]: unknown },
    options?: RunCommandOptions
  ): Promise<Document>;
}

/**
 * @see {@link https://www.mongodb.com/docs/v6.0/reference/command/nav-sessions/}
 */
interface RunSessionCommand {
  (
    db: Db,
    spec: { killSessions: ServerSessionId[] },
    options?: RunCommandOptions
  ): Promise<unknown>;
}

interface RunCommand
  extends RunDiagnosticsCommand,
    RunAdministrationCommand,
    RunSessionCommand {}

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
  /**
   * NB: Driver spec says that drivers command method should always run commands
   * with primary readPreference disregarding whatever is the readPreference
   * of the client/database. We don't want that, and instead want all the
   * commands to run with whatever readPreference user has provided during the
   * connection
   *
   * @see https://github.com/mongodb/specifications/blob/master/source/server-selection/server-selection.rst#use-of-read-preferences-with-commands
   */
  const readPreference = db.readPreference ?? ReadPreference.PRIMARY_PREFERRED;

  return db.command(
    { ...spec },
    { readPreference, ...options }
    // It's pretty hard to convince TypeScript that we are doing the right thing
    // here due to how vague the driver types are hence the `any` assertion
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ) as Promise<any>;
};
