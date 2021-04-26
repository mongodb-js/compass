import Database from './database';
import {
  shellApiClassDefault,
  hasAsyncChild,
  ShellApiClass, returnsPromise, serverVersions
} from './decorators';

import type { Document } from '@mongosh/service-provider-core';
import { assertArgsDefinedType, getConfigDB, getPrintableShardStatus } from './helpers';
import { ServerVersions, asPrintable } from './enums';
import { CommandResult, UpdateResult } from './result';
import { redactCredentials } from '@mongosh/history';

@shellApiClassDefault
@hasAsyncChild
export default class Shard extends ShellApiClass {
  _database: Database;

  constructor(database: Database) {
    super();
    this._database = database;
  }

  /**
   * Internal method to determine what is printed for this class.
   */
  [asPrintable](): string {
    return `Shard class connected to ${redactCredentials(this._database._mongo._uri)} via db ${this._database._name}`;
  }

  /**
   * Internal helper for emitting Shard API call events.
   *
   * @param methodName
   * @param methodArguments
   * @private
   */
  private _emitShardApiCall(methodName: string, methodArguments: Document = {}): void {
    this._database._mongo._internalState.emitApiCall({
      method: methodName,
      class: 'Shard',
      arguments: methodArguments
    });
  }

  @returnsPromise
  async enableSharding(database: string, primaryShard?: string): Promise<Document> {
    assertArgsDefinedType([database, primaryShard], ['string', [undefined, 'string']], 'Shard.enableSharding');
    this._emitShardApiCall('enableSharding', { database, primaryShard });

    const cmd = {
      enableSharding: database
    } as any;
    if (primaryShard !== undefined) {
      cmd.primaryShard = primaryShard;
    }
    try {
      return await this._database._runAdminCommand(cmd);
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. Are you connected to mongos?`;
      }
      throw error;
    }
  }

  @returnsPromise
  async shardCollection(namespace: string, key: Document, unique?: boolean, options?: Document): Promise<Document> {
    assertArgsDefinedType([namespace, key, unique, options], ['string', 'object', [undefined, 'boolean'], [undefined, 'object']], 'Shard.shardCollection');
    this._emitShardApiCall('shardCollection', { namespace, key, unique, options });

    const cmd = {
      shardCollection: namespace,
      key: key
    } as any;
    if (unique !== undefined) {
      cmd.unique = unique;
    }
    const orderedCmd = options !== undefined ? { ...cmd, ...options } : cmd;
    try {
      return await this._database._runAdminCommand(orderedCmd);
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. Are you connected to mongos?`;
      }
      throw error;
    }
  }

  @returnsPromise
  async status(verbose = false): Promise<CommandResult> {
    const result = await getPrintableShardStatus(this._database, verbose);
    return new CommandResult('StatsResult', result);
  }

  @returnsPromise
  async addShard(url: string): Promise<Document> {
    assertArgsDefinedType([url], ['string'], 'Shard.addShard');
    await getConfigDB(this._database);
    this._emitShardApiCall('addShard', { url });
    return this._database._runAdminCommand({
      addShard: url
    });
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async addShardToZone(shard: string, zone: string): Promise<Document> {
    assertArgsDefinedType([shard, zone], ['string', 'string'], 'Shard.addShardToZone');
    this._emitShardApiCall('addShardToZone', { shard, zone });
    await getConfigDB(this._database); // will error if not connected to mongos
    return this._database._runAdminCommand({
      addShardToZone: shard,
      zone: zone
    });
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async addShardTag(shard: string, tag: string): Promise<Document> {
    assertArgsDefinedType([shard, tag], ['string', 'string'], 'Shard.addShardTag');
    this._emitShardApiCall('addShardTag', { shard, tag });
    try {
      return await this.addShardToZone(shard, tag);
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. This method aliases to addShardToZone which exists only for server versions > 3.4.`;
      }
      throw error;
    }
  }

  @returnsPromise
  async updateZoneKeyRange(namespace: string, min: Document, max: Document, zone: string | null): Promise<Document> {
    assertArgsDefinedType([namespace, min, max, zone], ['string', 'object', 'object', true], 'Shard.updateZoneKeyRange');
    this._emitShardApiCall('updateZoneKeyRange', { namespace, min, max, zone });

    await getConfigDB(this._database); // will error if not connected to mongos
    return await this._database._runAdminCommand({
      updateZoneKeyRange: namespace,
      min,
      max,
      zone
    });
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async addTagRange(namespace: string, min: Document, max: Document, zone: string): Promise<Document> {
    assertArgsDefinedType([namespace, min, max, zone], ['string', 'object', 'object', true], 'Shard.addTagRange');
    this._emitShardApiCall('addTagRange', { namespace, min, max, zone });

    try {
      return await this.updateZoneKeyRange(
        namespace,
        min,
        max,
        zone
      );
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. This method aliases to updateZoneKeyRange which exists only for server versions > 3.4.`;
      }
      throw error;
    }
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async removeRangeFromZone(ns: string, min: Document, max: Document): Promise<Document> {
    assertArgsDefinedType([ns, min, max], ['string', 'object', 'object'], 'Shard.removeRangeFromZone');
    this._emitShardApiCall('removeRangeFromZone', { ns, min, max });
    return this.updateZoneKeyRange(ns, min, max, null);
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async removeTagRange(ns: string, min: Document, max: Document): Promise<Document> {
    assertArgsDefinedType([ns, min, max], ['string', 'object', 'object'], 'Shard.removeTagRange');
    this._emitShardApiCall('removeTagRange', { ns, min, max });
    try {
      return await this.updateZoneKeyRange(ns, min, max, null);
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. This method aliases to updateZoneKeyRange which exists only for server versions > 3.4.`;
      }
      throw error;
    }
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async removeShardFromZone(shard: string, zone: string): Promise<Document> {
    assertArgsDefinedType([shard, zone], ['string', 'string'], 'Shard.removeShardFromZone');
    this._emitShardApiCall('removeShardFromZone', { shard, zone });

    await getConfigDB(this._database); // will error if not connected to mongos
    return await this._database._runAdminCommand({
      removeShardFromZone: shard,
      zone: zone
    });
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async removeShardTag(shard: string, tag: string): Promise<Document> {
    assertArgsDefinedType([shard, tag], ['string', 'string'], 'Shard.removeShardTag');
    this._emitShardApiCall('removeTagRange', { shard, tag });
    try {
      return await this.removeShardFromZone(shard, tag);
    } catch (error) {
      if (error.codeName === 'CommandNotFound') {
        error.message = `${error.message}. This method aliases to removeShardFromZone which exists only for server versions > 3.4.`;
      }
      throw error;
    }
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async enableAutoSplit(): Promise<UpdateResult> {
    this._emitShardApiCall('enableAutoSplit', {});
    const config = await getConfigDB(this._database);
    return await config.getCollection('settings').updateOne(
      { _id: 'autosplit' },
      { $set: { enabled: true } },
      { upsert: true, writeConcern: { w: 'majority', wtimeout: 30000 } }
    ) as UpdateResult;
  }

  @returnsPromise
  @serverVersions(['3.4.0', ServerVersions.latest])
  async disableAutoSplit(): Promise<UpdateResult> {
    this._emitShardApiCall('disableAutoSplit', {});
    const config = await getConfigDB(this._database);
    return await config.getCollection('settings').updateOne(
      { _id: 'autosplit' },
      { $set: { enabled: false } },
      { upsert: true, writeConcern: { w: 'majority', wtimeout: 30000 } }
    ) as UpdateResult;
  }

  @returnsPromise
  async splitAt(ns: string, query: Document): Promise<Document> {
    assertArgsDefinedType([ns, query], ['string', 'object'], 'Shard.splitAt');
    this._emitShardApiCall('splitAt', { ns, query });
    return this._database._runAdminCommand({
      split: ns,
      middle: query
    });
  }

  @returnsPromise
  async splitFind(ns: string, query: Document): Promise<Document> {
    assertArgsDefinedType([ns, query], ['string', 'object'], 'Shard.splitFind');
    this._emitShardApiCall('splitFind', { ns, query });
    return this._database._runAdminCommand({
      split: ns,
      find: query
    });
  }

  @returnsPromise
  async moveChunk(ns: string, query: Document, destination: string | undefined): Promise<Document> {
    assertArgsDefinedType([ns, query, destination], ['string', 'object', 'string'], 'Shard.moveChunk');
    this._emitShardApiCall('moveChunk', { ns, query, destination });
    return this._database._runAdminCommand({
      moveChunk: ns,
      find: query,
      to: destination
    });
  }

  @returnsPromise
  @serverVersions(['4.4.0', ServerVersions.latest])
  async balancerCollectionStatus(ns: string): Promise<Document> {
    assertArgsDefinedType([ns], ['string'], 'Shard.balancerCollectionStatus');
    this._emitShardApiCall('balancerCollectionStatus', { ns });
    return this._database._runAdminCommand({
      balancerCollectionStatus: ns
    });
  }


  @returnsPromise
  async enableBalancing(ns: string): Promise<UpdateResult> {
    assertArgsDefinedType([ns], ['string'], 'Shard.enableBalancing');
    this._emitShardApiCall('enableBalancing', { ns });
    const config = await getConfigDB(this._database);
    return await config.getCollection('collections').updateOne(
      { _id: ns },
      { $set: { 'noBalance': false } },
      { writeConcern: { w: 'majority', wtimeout: 60000 } }
    ) as UpdateResult;
  }

  @returnsPromise
  async disableBalancing(ns: string): Promise<UpdateResult> {
    assertArgsDefinedType([ns], ['string'], 'Shard.disableBalancing');
    this._emitShardApiCall('disableBalancing', { ns });
    const config = await getConfigDB(this._database);
    return await config.getCollection('collections').updateOne(
      { _id: ns },
      { $set: { 'noBalance': true } },
      { writeConcern: { w: 'majority', wtimeout: 60000 } }
    ) as UpdateResult;
  }

  @returnsPromise
  async getBalancerState(): Promise<boolean> {
    this._emitShardApiCall('getBalancerState', {});
    const config = await getConfigDB(this._database);
    const doc = await config.getCollection('settings').findOne({ _id: 'balancer' });
    if (doc === null || doc === undefined) {
      return true;
    }
    return !doc.stopped;
  }

  @returnsPromise
  async isBalancerRunning(): Promise<Document> {
    this._emitShardApiCall('isBalancerRunning', {});
    await getConfigDB(this._database);
    return this._database._runAdminCommand({
      balancerStatus: 1
    });
  }

  @returnsPromise
  async startBalancer(timeout = 60000): Promise<Document> {
    assertArgsDefinedType([timeout], ['number'], 'Shard.startBalancer');
    this._emitShardApiCall('startBalancer', { timeout });
    return this._database._runAdminCommand({
      balancerStart: 1, maxTimeMS: timeout
    });
  }

  @returnsPromise
  async stopBalancer(timeout = 60000): Promise<Document> {
    assertArgsDefinedType([timeout], ['number'], 'Shard.stopBalancer');
    this._emitShardApiCall('stopBalancer', { timeout });
    return this._database._runAdminCommand({
      balancerStop: 1, maxTimeMS: timeout
    });
  }

  @returnsPromise
  async setBalancerState(state: boolean): Promise<Document> {
    assertArgsDefinedType([state], ['boolean'], 'Shard.setBalancerState');
    this._emitShardApiCall('setBalancerState', { state });
    if (state) {
      return this.startBalancer();
    }
    return this.stopBalancer();
  }
}
