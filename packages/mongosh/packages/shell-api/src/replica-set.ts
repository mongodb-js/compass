import Database from './database';
import {
  shellApiClassDefault,
  hasAsyncChild,
  ShellApiClass,
  returnsPromise,
  deprecated
} from './decorators';
import {
  Document
} from '@mongosh/service-provider-core';
import { asPrintable } from './enums';
import { assertArgsDefinedType } from './helpers';
import { CommonErrors, MongoshDeprecatedError, MongoshInvalidInputError, MongoshRuntimeError } from '@mongosh/errors';
import { CommandResult } from './result';
import { redactCredentials } from '@mongosh/history';

@shellApiClassDefault
@hasAsyncChild
export default class ReplicaSet extends ShellApiClass {
  _database: Database;

  constructor(database: Database) {
    super();
    this._database = database;
  }

  /**
   *  rs.initiate calls replSetInitiate admin command.
   *
   * @param config
   */
  @returnsPromise
  async initiate(config = {}): Promise<Document> {
    this._emitReplicaSetApiCall('initiate', { config });
    return this._database._runAdminCommand({ replSetInitiate: config });
  }

  /**
   *  rs.config calls replSetReconfig admin command.
   *
   *  Returns a document that contains the current replica set configuration.
   */
  @returnsPromise
  async config(): Promise<Document> {
    this._emitReplicaSetApiCall('config', {});
    try {
      const result = await this._database._runAdminCommand(
        { replSetGetConfig: 1 }
      );
      if (result.config === undefined) {
        throw new MongoshRuntimeError('Documented returned from command replSetReconfig does not contain \'config\'');
      }
      return result.config;
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        const doc = await this._database.getSiblingDB('local').getCollection('system.replset').findOne();
        if (doc === null) {
          throw new MongoshRuntimeError('No documents in local.system.replset');
        }
        return doc;
      }
      throw error;
    }
  }

  /**
   * Alias, conf is documented but config is not
   */
  @returnsPromise
  async conf(): Promise<Document> {
    return this.config();
  }

  /**
   *  rs.reconfig calls replSetReconfig admin command.
   *
   *  @param config
   *  @param options
   */
  @returnsPromise
  async reconfig(config: Document, options = {}): Promise<Document> {
    assertArgsDefinedType([ config, options ], ['object', [undefined, 'object']], 'ReplicaSet.reconfig');
    this._emitReplicaSetApiCall('reconfig', { config, options });

    const conf = await this.conf();

    config.version = conf.version ? conf.version + 1 : 1;
    config.protocolVersion ??= conf.protocolVersion; // Needed on mongod 4.0.x
    const cmd = { replSetReconfig: config, ...options };

    return this._database._runAdminCommand(cmd);
  }

  @returnsPromise
  async status(): Promise<Document> {
    this._emitReplicaSetApiCall('status', {});
    return this._database._runAdminCommand(
      {
        replSetGetStatus: 1,
      }
    );
  }

  @returnsPromise
  async isMaster(): Promise<Document> {
    this._emitReplicaSetApiCall('isMaster', {});
    return this._database._runAdminCommand(
      {
        isMaster: 1,
      }
    );
  }

  @returnsPromise
  async printSecondaryReplicationInfo(): Promise<CommandResult> {
    this._emitReplicaSetApiCall('printSecondaryReplicationInfo', {});
    return this._database.printSecondaryReplicationInfo();
  }

  @deprecated
  @returnsPromise
  async printSlaveReplicationInfo(): Promise<CommandResult> {
    throw new MongoshDeprecatedError('printSlaveReplicationInfo has been deprecated. Use printSecondaryReplicationInfo instead');
  }

  @returnsPromise
  async printReplicationInfo(): Promise<CommandResult> {
    this._emitReplicaSetApiCall('printReplicationInfo', {});
    return this._database.printReplicationInfo();
  }

  @returnsPromise
  async add(hostport: string | Document, arb?: boolean): Promise<Document> {
    assertArgsDefinedType([hostport, arb], [['string', 'object'], [undefined, 'boolean']], 'ReplicaSet.add');
    this._emitReplicaSetApiCall('add', { hostport, arb });

    const local = this._database.getSiblingDB('local');
    if (await local.getCollection('system.replset').countDocuments({}) !== 1) {
      throw new MongoshRuntimeError('local.system.replset has unexpected contents', CommonErrors.CommandFailed);
    }
    const configDoc = await local.getCollection('system.replset').findOne();
    if (configDoc === undefined || configDoc === null) {
      throw new MongoshRuntimeError('no config object retrievable from local.system.replset', CommonErrors.CommandFailed);
    }

    configDoc.version++;

    const max = Math.max(...configDoc.members.map((m: any) => m._id));
    let cfg: any;
    if (typeof hostport === 'string') {
      cfg = { _id: max + 1, host: hostport };
      if (arb) {
        cfg.arbiterOnly = true;
      }
    } else if (arb === true) {
      throw new MongoshInvalidInputError(
        `Expected first parameter to be a host-and-port string of arbiter, but got ${JSON.stringify(hostport)}`,
        CommonErrors.InvalidArgument
      );
    } else {
      cfg = hostport;
      if (cfg._id === null || cfg._id === undefined) {
        cfg._id = max + 1;
      }
    }

    configDoc.members.push(cfg);
    return this._database._runAdminCommand(
      {
        replSetReconfig: configDoc,
      }
    );
  }

  @returnsPromise
  async addArb(hostname: string): Promise<Document> {
    this._emitReplicaSetApiCall('addArb', { hostname });
    return this.add(hostname, true);
  }

  @returnsPromise
  async remove(hostname: string): Promise<Document> {
    assertArgsDefinedType([hostname], ['string'], 'ReplicaSet.remove');
    this._emitReplicaSetApiCall('remove', { hostname });
    const local = this._database.getSiblingDB('local');
    if (await local.getCollection('system.replset').countDocuments({}) !== 1) {
      throw new MongoshRuntimeError('local.system.replset has unexpected contents', CommonErrors.CommandFailed);
    }
    const configDoc = await local.getCollection('system.replset').findOne();
    if (configDoc === null || configDoc === undefined) {
      throw new MongoshRuntimeError('no config object retrievable from local.system.replset', CommonErrors.CommandFailed);
    }
    configDoc.version++;

    for (let i = 0; i < configDoc.members.length; i++) {
      if (configDoc.members[i].host === hostname) {
        configDoc.members.splice(i, 1);
        return this._database._runAdminCommand(
          {
            replSetReconfig: configDoc,
          }
        );
      }
    }
    throw new MongoshInvalidInputError(
      `Couldn't find ${hostname} in ${JSON.stringify(configDoc.members)}. Is ${hostname} a member of this replset?`,
      CommonErrors.InvalidArgument
    );
  }

  @returnsPromise
  async freeze(secs: number): Promise<Document> {
    assertArgsDefinedType([secs], ['number'], 'ReplicaSet.freeze');
    this._emitReplicaSetApiCall('freeze', { secs });
    return this._database._runAdminCommand(
      {
        replSetFreeze: secs,
      }
    );
  }

  @returnsPromise
  async stepDown(stepdownSecs?: number, catchUpSecs?: number): Promise<Document> {
    assertArgsDefinedType([stepdownSecs, catchUpSecs], [[undefined, 'number'], [undefined, 'number']], 'ReplicaSet.stepDown');
    this._emitReplicaSetApiCall('stepDown', { stepdownSecs, catchUpSecs });
    const cmd = {
      replSetStepDown: stepdownSecs === undefined ? 60 : stepdownSecs,
    } as any;
    if (catchUpSecs !== undefined) {
      cmd.secondaryCatchUpPeriodSecs = catchUpSecs;
    }
    return this._database._runAdminCommand(
      cmd
    );
  }

  @returnsPromise
  async syncFrom(host: string): Promise<Document> {
    assertArgsDefinedType([host], ['string'], 'ReplicaSet.syncFrom');
    this._emitReplicaSetApiCall('syncFrom', { host });
    return this._database._runAdminCommand(
      {
        replSetSyncFrom: host,
      }
    );
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return `ReplicaSet class connected to ${redactCredentials(this._database._mongo._uri)} via db ${this._database._name}`;
  }

  /**
   * Internal helper for emitting ReplicaSet API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitReplicaSetApiCall(methodName: string, methodArguments: Document = {}): void {
    this._database._mongo._internalState.emitApiCall({
      method: methodName,
      class: 'ReplicaSet',
      arguments: methodArguments
    });
  }
}
