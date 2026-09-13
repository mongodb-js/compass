/* eslint-disable no-fallthrough */
/********************
 * ▌ ▌▐  ▗▜ ▗▐      *
 * ▌ ▌▜▀ ▄▐ ▄▜▀ ▌ ▌ *
 * ▌ ▌▐ ▖▐▐ ▐▐ ▖▚▄▌ *
 * ▝▀  ▀ ▀▘▘▀▘▀ ▗▄▘ *
 ********************/

// There should be no changes.

import type { MessagePortMain } from 'electron';
import { DataServiceImpl } from './data-service';
import { bsonType } from 'bson';
import util from 'node:util';
import { markBSON } from './transfer';

util.inspect.defaultOptions.compact = true;
util.inspect.defaultOptions.breakLength = 100000;
util.inspect.defaultOptions.depth = 100;

export type UtilityOptions = {
  id: number;
  port: MessagePortMain;
  onClose: () => void;
};

type PromiseMethodKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? K : never;
}[keyof T];

export type OperationName = PromiseMethodKeys<DataServiceImpl>;

export class Message {
  requestId: number;
  operation: OperationName;
  args: any[];

  constructor(data: any) {
    this.requestId = data.requestId;
    this.operation = data.operation;
    this.args = data.args;
  }
}

export class DataServiceUtility extends DataServiceImpl {
  readonly utilityOptions: UtilityOptions;
  constructor(
    utilityOptions: UtilityOptions,
    ...args: ConstructorParameters<typeof DataServiceImpl>
  ) {
    super(...args);
    this._id = utilityOptions.id;
    this.utilityOptions = utilityOptions;
    this.utilityOptions.port.addListener('message', this.onMessage.bind(this));
    this.utilityOptions.port.addListener('close', this.onClose.bind(this));
    this.utilityOptions.port.start();
  }

  private onClose() {
    this.utilityOptions.onClose();
  }

  private onMessage({ data }: Electron.MessageEvent) {
    const req = new Message(data);
    console.log('utility-message', data);
    // @ts-expect-error: I am not sure why
    this[req.operation](...req.args).then(
      this.onResult.bind(this, req),
      this.onError.bind(this, req)
    );
  }

  private onResult(req: Message, res: any) {
    console.log('utility-result', req.requestId, res);
    this.utilityOptions.port.postMessage({
      responseTo: req.requestId,
      ok: 1,
      res: markBSON(res),
    });
  }

  private onError(req: Message, error: any) {
    console.log('utility-error', req.requestId, error);
    this.utilityOptions.port.postMessage({
      responseTo: req.requestId,
      ok: 0,
      error,
    });
  }
}

// function a () {
// type PromiseMethodKeys<T> = {
//   [K in keyof T]: T[K] extends (...args: any[]) => Promise<any> ? K : never;
// }[keyof T];
//         const method = (message.data.method as PromiseMethodKeys<DataServiceImpl>);
//       switch(method) {
//         case 'on':
//         case 'off':
//         case 'removeListener':
//         case 'once':

//         case 'id':
//         case 'getMongoClientConnectionOptions':
//         case 'getConnectionOptions':
//         case 'getConnectionString':
//         case 'setCSFLEEnabled':
//         case 'getCSFLEMode':
//         case 'isWritable':
//         case 'isMongos':
//         case 'getCurrentTopologyType':
//         case 'isConnected':
//         case 'isUpdateAllowed':
//         case 'knownSchemaForCollection':
//         case 'getLastSeenTopology':
//         case 'configuredKMSProviders':
//           return this.replyError();

//         case 'aggregateCursor':
//         case 'findCursor':
//         case 'sampleCursor':

//         case 'addReauthenticationHandler':

//         case 'collectionStats':
//         case 'collectionInfo':
//         case 'killOp':
//         case 'listCollections':
//         case 'listDatabases':
//         case 'connect':
//         case 'estimatedCount':
//         case 'count':
//         case 'createCollection':
//         case 'createIndex':
//         case 'deleteOne':
//         case 'deleteMany':
//         case 'updateMany':
//         case 'disconnect':
//         case 'dropCollection':
//         case 'renameCollection':
//         case 'dropDatabase':
//         case 'dropIndex':
//         case 'isListSearchIndexesSupported':
//         case 'getSearchIndexes':
//         case 'createSearchIndex':
//         case 'updateSearchIndex':
//         case 'dropSearchIndex':
//         case 'aggregate':
//         case 'find':
//         case 'findOneAndReplace':
//         case 'findOneAndUpdate':
//         case 'updateOne':
//         case 'replaceOne':
//         case 'explainFind':
//         case 'explainAggregate':
//         case 'fetchShardKey':
//         case 'indexes':
//         case 'instance':
//         case 'insertOne':
//         case 'insertMany':
//         case 'updateCollection':
//         case 'bulkWrite':
//         case 'currentOp':
//         case 'serverStatus':
//         case 'top':
//         case 'createView':
//         case 'sample':

//         case 'databaseStats':
//         case 'previewUpdate':
//         case 'createDataKey':
//         case 'getUpdatedSecrets':
//         case 'listStreamProcessors':
//         case 'startStreamProcessor':
//         case 'stopStreamProcessor':
//         case 'dropStreamProcessor':
//       }
// }
