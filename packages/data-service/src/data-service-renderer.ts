/****************************
 * ▛▀▖        ▌             *
 * ▙▄▘▞▀▖▛▀▖▞▀▌▞▀▖▙▀▖▞▀▖▙▀▖ *
 * ▌▚ ▛▀ ▌ ▌▌ ▌▛▀ ▌  ▛▀ ▌   *
 * ▘ ▘▝▀▘▘ ▘▝▀▘▝▀▘▘  ▝▀▘▘   *
 ****************************/

/**
 * This file contains the implementation of the DataService class in the renderer
 * It should only use IPC to ask the utility Node.js process to perform the action for
 * a given method. We subclass `DataServiceImpl` to make it fully compatible with the current implementation
 * It will incrementally replace each super method with an own definition that does this IPC until we can remove
 * the subclass-ing.
 */

import { omit } from 'lodash';
import { DataServiceImpl, type DataService } from './data-service';
import type { Message, OperationName } from './data-service-utility';
import { markBSON, unmarkBSON } from './transfer';

let reqId = 0;

export class DataServiceRenderer
  extends DataServiceImpl
  implements DataService
{
  /** */
  private portToUtility: MessagePort;
  private pending: Map<number, PromiseWithResolvers<any>> = new Map();

  constructor(...args: ConstructorParameters<typeof DataServiceImpl>) {
    super(...args);
    const channel = new MessageChannel();
    this.portToUtility = channel.port1;
    this.portToUtility.addEventListener('message', this.onMessage.bind(this));
    this.portToUtility.start();

    const bootMessage = {
      type: 'compass:data-service:port',
      id: this.id,
      // `notifyDeviceFlow` is a function and can't be structured-cloned
      connectionOptions: omit(
        this.getConnectionOptions(),
        'oidc.notifyDeviceFlow'
      ),
    };

    globalThis.postMessage(bootMessage, '*', [channel.port2]);
  }

  private send(msgInit: Pick<Message, 'operation' | 'args'>): number {
    const requestId = reqId++;
    const { bsonValues } = markBSON(msgInit.args);
    const message = {
      requestId,
      operation: msgInit.operation,
      args: msgInit.args,
      bsonValues,
    };
    console.log('render-send', message);
    this.portToUtility.postMessage(message);
    this.pending.set(requestId, Promise.withResolvers());
    return requestId;
  }

  private onMessage({
    data,
  }: MessageEvent<
    { responseTo: number } & (
      | { ok: 0; error: any }
      | { ok: 1; res: any; bsonValues: Map<object, string> }
    )
  >) {
    console.log('render-message', data);
    const resolvers = this.pending.get(data.responseTo);
    if (data.ok) resolvers?.resolve(unmarkBSON(data.res, data.bsonValues));
    else resolvers?.reject(data.error);
  }

  private async do(operation: OperationName, args: unknown[]) {
    console.log('render doing', operation, args);
    const res = await this.pending.get(this.send({ operation, args }))?.promise;
    console.log('render done ', operation, res);
    return res;
  }

  async connect(options?: {
    signal?: AbortSignal;
    productName?: string;
    productDocsLink?: string;
  }) {
    delete options?.signal;
    await this.do('connect', [options]);
  }
  async currentOp(...args: Parameters<DataService['currentOp']>) {
    return await this.do('currentOp', args);
  }
  async collectionStats(...args: Parameters<DataService['collectionInfo']>) {
    return await this.do('collectionStats', args);
  }
  async collectionInfo(...args: Parameters<DataService['collectionInfo']>) {
    return await this.do('collectionInfo', args);
  }
  async killOp(...args: Parameters<DataService['killOp']>) {
    return await this.do('killOp', args);
  }
  async listCollections(...args: Parameters<DataService['listCollections']>) {
    return await this.do('listCollections', args);
  }
  async listDatabases(...args: Parameters<DataService['listDatabases']>) {
    return await this.do('listDatabases', args);
  }
  async estimatedCount(...args: Parameters<DataService['estimatedCount']>) {
    return await this.do('estimatedCount', args);
  }
  async count(...args: Parameters<DataService['count']>) {
    return await this.do('count', args);
  }
  async createCollection(...args: Parameters<DataService['createCollection']>) {
    return await this.do('createCollection', args);
  }
  async createIndex(...args: Parameters<DataService['createIndex']>) {
    return await this.do('createIndex', args);
  }
  async deleteOne(...args: Parameters<DataService['deleteOne']>) {
    return await this.do('deleteOne', args);
  }
  async deleteMany(...args: Parameters<DataService['deleteMany']>) {
    return await this.do('deleteMany', args);
  }
  async updateMany(...args: Parameters<DataService['updateMany']>) {
    return await this.do('updateMany', args);
  }
  async disconnect(...args: Parameters<DataService['disconnect']>) {
    return await this.do('disconnect', args);
  }
  async dropCollection(...args: Parameters<DataService['dropCollection']>) {
    return await this.do('dropCollection', args);
  }
  async renameCollection(...args: Parameters<DataService['renameCollection']>) {
    return await this.do('renameCollection', args);
  }
  async dropDatabase(...args: Parameters<DataService['dropDatabase']>) {
    return await this.do('dropDatabase', args);
  }
  async dropIndex(...args: Parameters<DataService['dropIndex']>) {
    return await this.do('dropIndex', args);
  }
  async isListSearchIndexesSupported(
    ...args: Parameters<DataService['isListSearchIndexesSupported']>
  ) {
    return await this.do('isListSearchIndexesSupported', args);
  }
  async getSearchIndexes(...args: Parameters<DataService['getSearchIndexes']>) {
    return await this.do('getSearchIndexes', args);
  }
  async createSearchIndex(
    ...args: Parameters<DataService['createSearchIndex']>
  ) {
    return await this.do('createSearchIndex', args);
  }
  async updateSearchIndex(
    ...args: Parameters<DataService['updateSearchIndex']>
  ) {
    return await this.do('updateSearchIndex', args);
  }
  async dropSearchIndex(...args: Parameters<DataService['dropSearchIndex']>) {
    return await this.do('dropSearchIndex', args);
  }
  async aggregate(...args: Parameters<DataService['aggregate']>) {
    return await this.do('aggregate', args);
  }
  async find(...args: Parameters<DataService['find']>) {
    return await this.do('find', args);
  }
  async findOneAndReplace(
    ...args: Parameters<DataService['findOneAndReplace']>
  ) {
    return await this.do('findOneAndReplace', args);
  }
  async findOneAndUpdate(...args: Parameters<DataService['findOneAndUpdate']>) {
    return await this.do('findOneAndUpdate', args);
  }
  async updateOne(...args: Parameters<DataService['updateOne']>) {
    return await this.do('updateOne', args);
  }
  async replaceOne(...args: Parameters<DataService['replaceOne']>) {
    return await this.do('replaceOne', args);
  }
  async explainFind(...args: Parameters<DataService['explainFind']>) {
    return await this.do('explainFind', args);
  }
  async explainAggregate(...args: Parameters<DataService['explainAggregate']>) {
    return await this.do('explainAggregate', args);
  }
  async fetchShardKey(...args: Parameters<DataService['fetchShardKey']>) {
    return await this.do('fetchShardKey', args);
  }
  async indexes(...args: Parameters<DataService['indexes']>) {
    return await this.do('indexes', args);
  }
  async instance(...args: Parameters<DataService['instance']>) {
    return await this.do('instance', args);
  }
  async insertOne(...args: Parameters<DataService['insertOne']>) {
    return await this.do('insertOne', args);
  }
  async insertMany(...args: Parameters<DataService['insertMany']>) {
    return await this.do('insertMany', args);
  }
  async updateCollection(...args: Parameters<DataService['updateCollection']>) {
    return await this.do('updateCollection', args);
  }
  async bulkWrite(...args: Parameters<DataService['bulkWrite']>) {
    return await this.do('bulkWrite', args);
  }
  async serverStatus(...args: Parameters<DataService['serverStatus']>) {
    return await this.do('serverStatus', args);
  }
  async top(...args: Parameters<DataService['top']>) {
    return await this.do('top', args);
  }
  async createView(...args: Parameters<DataService['createView']>) {
    return await this.do('createView', args);
  }
  async sample(...args: Parameters<DataService['sample']>) {
    return await this.do('sample', args);
  }
}
