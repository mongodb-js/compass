/* eslint-disable complexity */
import {
  CommonErrors,
  MongoshDeprecatedError,
  MongoshInternalError,
  MongoshInvalidInputError,
  MongoshRuntimeError,
  MongoshUnimplementedError
} from '@mongosh/errors';
import {
  classPlatforms,
  classReturnsPromise,
  hasAsyncChild, platforms,
  returnsPromise,
  returnType,
  serverVersions,
  ShellApiClass,
  shellApiClassDefault,
  topologies,
  deprecated
} from './decorators';
import {
  ChangeStreamOptions,
  Document,
  generateUri,
  ReadConcernLevelId,
  ReadPreference,
  ReadPreferenceLike,
  ReadPreferenceModeId,
  ReplPlatform,
  ServiceProvider,
  TransactionOptions,
  MongoClientOptions,
  AutoEncryptionOptions as SPAutoEncryption,
  ServerApi,
  ServerApiVersionId
} from '@mongosh/service-provider-core';
import Database from './database';
import ShellInternalState from './shell-internal-state';
import { CommandResult } from './result';
import { redactCredentials } from '@mongosh/history';
import { asPrintable, ServerVersions, Topologies } from './enums';
import Session from './session';
import { assertArgsDefinedType, processFLEOptions } from './helpers';
import ChangeStreamCursor from './change-stream-cursor';
import { blockedByDriverMetadata } from './error-codes';
import {
  ClientSideFieldLevelEncryptionOptions,
  KeyVault,
  ClientEncryption
} from './field-level-encryption';
import { ShellApiErrors } from './error-codes';

@shellApiClassDefault
@hasAsyncChild
@classReturnsPromise
@classPlatforms([ ReplPlatform.CLI ] )
export default class Mongo extends ShellApiClass {
  private __serviceProvider: ServiceProvider | null = null;
  public _databases: Record<string, Database>;
  public _internalState: ShellInternalState;
  public _uri: string;
  public _fleOptions: SPAutoEncryption | undefined;
  public _apiOptions?: ServerApi;
  private _keyVault: KeyVault | undefined; // need to keep it around so that the ShellApi ClientEncryption class can access it
  private _clientEncryption: ClientEncryption | undefined;
  private _readPreferenceWasExplicitlyRequested = false;
  private _explicitEncryptionOnly = false;

  constructor(
    internalState: ShellInternalState,
    uri?: string,
    fleOptions?: ClientSideFieldLevelEncryptionOptions,
    otherOptions?: { api?: ServerApi | ServerApiVersionId },
    sp?: ServiceProvider
  ) {
    super();
    this._internalState = internalState;
    this._databases = {};
    if (sp) {
      this.__serviceProvider = sp;
    }
    if (typeof uri === 'string') {
      this._uri = generateUri({ _: [uri] });
    } else {
      this._uri = sp?.getURI?.() ?? generateUri({ _: ['mongodb://localhost/'] });
    }
    this._readPreferenceWasExplicitlyRequested = /\breadPreference=/.test(this._uri);
    if (fleOptions) {
      if (fleOptions.explicitEncryptionOnly !== undefined) {
        if (fleOptions.schemaMap !== undefined) {
          throw new MongoshInvalidInputError('explicitEncryptionOnly and schemaMap are mutually exclusive', CommonErrors.InvalidArgument);
        }
        fleOptions = { ...fleOptions };
        this._explicitEncryptionOnly = !!fleOptions.explicitEncryptionOnly;
        delete fleOptions.explicitEncryptionOnly;
      }
      this._fleOptions = processFLEOptions(fleOptions);
    } else {
      const spFleOptions = sp?.getFleOptions?.();
      if (spFleOptions) {
        this._fleOptions = spFleOptions;
      }
    }
    if (otherOptions?.api) {
      if (typeof otherOptions.api === 'string') {
        this._apiOptions = { version: otherOptions.api };
      } else {
        this._apiOptions = otherOptions.api;
      }
    }
  }

  // We don't have a ServiceProvider available until we are connected, but
  // generally speaking, it's always there, so instead of using a type of
  // `ServiceProvider | null` and a data property, we use a getter that throws
  // if used too early.
  get _serviceProvider(): ServiceProvider {
    if (this.__serviceProvider === null) {
      throw new MongoshInternalError('No ServiceProvider available for this mongo', ShellApiErrors.NotConnected);
    }
    return this.__serviceProvider;
  }

  // For testing.
  set _serviceProvider(sp: ServiceProvider) {
    this.__serviceProvider = sp;
  }

  async _batchSize(): Promise<number> {
    return await this._internalState.shellApi.config.get('batchSize');
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return redactCredentials(this._uri);
  }

  /**
   * Internal helper for emitting mongo API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitMongoApiCall(methodName: string, methodArguments: Document = {}): void {
    this._internalState.emitApiCall({
      method: methodName,
      class: 'Mongo',
      uri: this._uri,
      arguments: methodArguments
    });
  }

  async connect(user?: string, pwd?: string): Promise<void> {
    const mongoClientOptions: MongoClientOptions = user || pwd ? {
      auth: { username: user, password: pwd }
    } : {};
    if (this._fleOptions && !this._explicitEncryptionOnly) {
      const extraOptions = {
        ...(this._fleOptions.extraOptions ?? {}),
        ...(await this._internalState.evaluationListener?.startMongocryptd?.() ?? {})
      };

      mongoClientOptions.autoEncryption = { ...this._fleOptions, extraOptions };
    }
    if (this._apiOptions) {
      mongoClientOptions.serverApi = this._apiOptions;
    }
    const parentProvider = this._internalState.initialServiceProvider;
    this.__serviceProvider = await parentProvider.getNewConnection(this._uri, mongoClientOptions);
  }

  _getDb(name: string): Database {
    assertArgsDefinedType([name], ['string']);
    if (!name.trim()) {
      throw new MongoshInvalidInputError('Database name cannot be empty.', CommonErrors.InvalidArgument);
    }

    if (!(name in this._databases)) {
      this._databases[name] = new Database(this, name);
    }
    return this._databases[name];
  }

  @returnType('Database')
  getDB(db: string): Database {
    assertArgsDefinedType([db], ['string'], 'Mongo.getDB');
    this._internalState.messageBus.emit('mongosh:getDB', { db });
    return this._getDb(db);
  }

  use(db: string): string {
    assertArgsDefinedType([db], ['string'], 'Mongo.use');
    this._internalState.messageBus.emit('mongosh:use', { db });

    let previousDbName;
    let previousDbMongo;
    try {
      const previousDb = this._internalState.context.db;
      previousDbName = previousDb?.getName?.();
      previousDbMongo = previousDb?._mongo;
    } catch (e) {
      if (e.code !== ShellApiErrors.NotConnected) {
        throw e;
      }
    }

    this._internalState.context.db = this._getDb(db);
    if (db === previousDbName && previousDbMongo === this) {
      return `already on db ${db}`;
    }
    return `switched to db ${db}`;
  }

  @returnsPromise
  async show(cmd: string, arg?: string): Promise<CommandResult> {
    this._internalState.messageBus.emit('mongosh:show', { method: `show ${cmd}` });

    switch (cmd) {
      case 'databases':
      case 'dbs':
        const result = await this._serviceProvider.listDatabases('admin', { readPreference: 'primaryPreferred' });
        if (!('databases' in result)) {
          const err = new MongoshRuntimeError('Got invalid result from "listDatabases"', CommonErrors.CommandFailed);
          this._internalState.messageBus.emit('mongosh:error', err);
          throw err;
        }

        return new CommandResult('ShowDatabasesResult', result.databases);
      case 'collections':
      case 'tables':
        const collectionNames = await this._internalState.currentDb._getCollectionNames({ readPreference: 'primaryPreferred' });
        return new CommandResult('ShowCollectionsResult', collectionNames);
      case 'profile':
        const sysprof = this._internalState.currentDb.getCollection('system.profile');
        const profiles = { count: await sysprof.countDocuments({}) } as Document;
        if (profiles.count !== 0) {
          profiles.result = await (sysprof.find({ millis: { $gt: 0 } })
            .sort({ $natural: -1 })
            .limit(5)
            .toArray());
        }
        return new CommandResult('ShowProfileResult', profiles);
      case 'users':
        const users = await this._internalState.currentDb.getUsers();
        return new CommandResult('ShowResult', users.users);
      case 'roles':
        const roles = await this._internalState.currentDb.getRoles({ showBuiltinRoles: true });
        return new CommandResult('ShowResult', roles.roles);
      case 'log':
        const log = await this._internalState.currentDb.adminCommand({ getLog: arg || 'global' });
        return new CommandResult('ShowResult', log.log);
      case 'logs':
        const logs = await this._internalState.currentDb.adminCommand({ getLog: '*' });
        return new CommandResult('ShowResult', logs.names);
      default:
        const err = new MongoshInvalidInputError(
          `'${cmd}' is not a valid argument for "show".`,
          CommonErrors.InvalidArgument
        );
        this._internalState.messageBus.emit('mongosh:error', err);
        throw err;
    }
  }
  async close(force: boolean): Promise<void> {
    const index = this._internalState.mongos.indexOf(this);
    if (index === -1) {
      process.emitWarning(new MongoshInternalError(`Closing untracked Mongo instance ${this[asPrintable]()}`));
    } else {
      this._internalState.mongos.splice(index, 1);
    }

    await this._serviceProvider.close(force);
  }

  getReadPrefMode(): ReadPreferenceModeId {
    return this._serviceProvider.getReadPreference().mode;
  }

  getReadPrefTagSet(): Record<string, string>[] | undefined {
    return this._serviceProvider.getReadPreference().tags;
  }

  getReadPref(): ReadPreference {
    return this._serviceProvider.getReadPreference();
  }

  _getExplicitlyRequestedReadPref(): { readPreference: ReadPreference } | undefined {
    return this._readPreferenceWasExplicitlyRequested ?
      { readPreference: this.getReadPref() } :
      undefined;
  }

  getReadConcern(): string | undefined {
    try {
      const rc = this._serviceProvider.getReadConcern();
      return rc ? rc.level : undefined;
    } catch {
      throw new MongoshInternalError('Error retrieving ReadConcern.');
    }
  }

  @returnsPromise
  async setReadPref(mode: ReadPreferenceLike, tagSet?: Record<string, string>[], hedgeOptions?: Document): Promise<void> {
    await this._serviceProvider.resetConnectionOptions({
      readPreference: this._serviceProvider.readPreferenceFromOptions({
        readPreference: mode,
        readPreferenceTags: tagSet,
        hedge: hedgeOptions
      })
    });
    this._readPreferenceWasExplicitlyRequested = true;
  }

  @returnsPromise
  async setReadConcern(level: ReadConcernLevelId): Promise<void> {
    await this._serviceProvider.resetConnectionOptions({ readConcern: { level: level } });
  }

  @topologies([Topologies.ReplSet])
  startSession(options: Document = {}): Session {
    const driverOptions = {};
    if (options === undefined) {
      return new Session(this, driverOptions, this._serviceProvider.startSession(driverOptions));
    }
    const defaultTransactionOptions = {} as TransactionOptions;

    // Only include option if not undef
    Object.assign(defaultTransactionOptions,
      options.readConcern && { readConcern: options.readConcern },
      options.writeConcern && { writeConcern: options.writeConcern },
      options.readPreference && { readPreference: options.readPreference }
    );
    Object.assign(driverOptions,
      Object.keys(defaultTransactionOptions).length > 0 && { defaultTransactionOptions: defaultTransactionOptions },
      options.causalConsistency !== undefined && { causalConsistency: options.causalConsistency }
    );
    return new Session(this, driverOptions, this._serviceProvider.startSession(driverOptions));
  }

  setCausalConsistency(): void {
    throw new MongoshUnimplementedError(
      'It is not possible to set causal consistency for an entire connection due to the driver, use startSession({causalConsistency: <>}) instead.',
      CommonErrors.NotImplemented,
      blockedByDriverMetadata('Mongo.setCausalConsistency')
    );
  }

  isCausalConsistency(): void {
    throw new MongoshUnimplementedError(
      'Causal consistency for drivers is set via Mongo.startSession and can be checked via session.getOptions. The default value is true',
      CommonErrors.NotImplemented,
      blockedByDriverMetadata('Mongo.isCausalConsistency')
    );
  }

  @deprecated
  setSlaveOk(): void {
    throw new MongoshDeprecatedError('Setting slaveOk is deprecated, use setReadPref instead.');
  }

  @deprecated
  setSecondaryOk(): void {
    throw new MongoshDeprecatedError('Setting secondaryOk is deprecated, use setReadPref instead.');
  }

  @serverVersions(['3.1.0', ServerVersions.latest])
  @topologies([Topologies.ReplSet, Topologies.Sharded])
  watch(pipeline: Document[] = [], options: ChangeStreamOptions = {}): ChangeStreamCursor {
    this._emitMongoApiCall('watch', { pipeline, options });
    const cursor = new ChangeStreamCursor(
      this._serviceProvider.watch(pipeline, options),
      redactCredentials(this._uri),
      this
    );
    this._internalState.currentCursor = cursor;
    return cursor;
  }

  @platforms([ReplPlatform.CLI])
  @serverVersions(['4.2.0', ServerVersions.latest])
  @returnType('ClientEncryption')
  getClientEncryption(): ClientEncryption {
    if (!this._fleOptions) {
      throw new MongoshInvalidInputError(
        'Cannot call getClientEncryption() without field-level encryption options', ShellApiErrors.NotUsingFLE);
    }
    if (!this._clientEncryption) {
      this._clientEncryption = new ClientEncryption(this);
    }
    return this._clientEncryption;
  }

  @platforms([ReplPlatform.CLI])
  @serverVersions(['4.2.0', ServerVersions.latest])
  @returnType('KeyVault')
  getKeyVault(): KeyVault {
    this._keyVault = new KeyVault(this.getClientEncryption());
    return this._keyVault;
  }
}
