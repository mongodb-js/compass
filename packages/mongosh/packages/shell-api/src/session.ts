import {
  classPlatforms,
  classReturnsPromise,
  hasAsyncChild,
  returnsPromise,
  ShellApiClass,
  shellApiClassDefault
} from './decorators';
import {
  Document,
  ReplPlatform,
  ClientSessionOptions,
  ClientSession,
  TransactionOptions,
  ClusterTime,
  TimestampType,
  ServerSessionId
} from '@mongosh/service-provider-core';
import { asPrintable } from './enums';
import Mongo from './mongo';
import Database from './database';
import { CommonErrors, MongoshInvalidInputError, MongoshUnimplementedError } from '@mongosh/errors';
import { blockedByDriverMetadata } from './error-codes';
import { assertArgsDefinedType } from './helpers';

@shellApiClassDefault
@hasAsyncChild
@classReturnsPromise
@classPlatforms([ ReplPlatform.CLI ] )
export default class Session extends ShellApiClass {
  public id: ServerSessionId | undefined;
  public _session: ClientSession;
  public _options: ClientSessionOptions;
  private _mongo: Mongo;
  private _databases: Record<string, Database>;

  constructor(mongo: Mongo, options: ClientSessionOptions, session: ClientSession) {
    super();
    this._session = session;
    this._options = options;
    this._mongo = mongo;
    this._databases = {};
    this.id = session.id;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): ServerSessionId | undefined {
    return this._session.id;
  }

  getDatabase(name: string): Database {
    assertArgsDefinedType([name], ['string'], 'Session.getDatabase');

    if (!name.trim()) {
      throw new MongoshInvalidInputError('Database name cannot be empty.', CommonErrors.InvalidArgument);
    }

    if (!(name in this._databases)) {
      this._databases[name] = new Database(this._mongo, name, this);
    }
    return this._databases[name];
  }

  advanceOperationTime(ts: TimestampType): void {
    this._session.advanceOperationTime(ts);
  }

  advanceClusterTime(): void {
    throw new MongoshUnimplementedError(
      'Calling advanceClusterTime is not currently supported due it not being supported in the driver, see NODE-2843.',
      CommonErrors.NotImplemented,
      blockedByDriverMetadata('Session.advanceClusterTime')
    );
  }

  @returnsPromise
  async endSession(): Promise<void> {
    return await this._session.endSession();
  }

  hasEnded(): boolean | undefined {
    return this._session.hasEnded;
  }

  getClusterTime(): ClusterTime | undefined {
    return this._session.clusterTime;
  }

  getOperationTime(): TimestampType | undefined {
    return this._session.operationTime;
  }

  getOptions(): ClientSessionOptions {
    return this._options;
  }

  startTransaction(options: TransactionOptions = {}): void {
    return this._session.startTransaction(options);
  }

  @returnsPromise
  async commitTransaction(): Promise<Document> {
    return await this._session.commitTransaction();
  }

  @returnsPromise
  async abortTransaction(): Promise<Document> {
    return await this._session.abortTransaction();
  }
}
