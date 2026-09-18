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
import type { ConnectionOptions } from './connection-options';
import type { TopologyDescriptionChangedEvent } from 'mongodb';
import util from 'node:util';
import { prepareForTransfer, readTransfer } from './transfer';
import type { DataServiceRequest, UtilityBoundMessage } from './protocol';

export type { OperationName, DataServiceRequest } from './protocol';

util.inspect.defaultOptions.compact = true;
util.inspect.defaultOptions.breakLength = 100000;
util.inspect.defaultOptions.depth = 100;

export type UtilityOptions = {
  id: number;
  port: MessagePortMain;
  onClose: () => void;
  /**
   * Whether the renderer holds a real `oidc.notifyDeviceFlow` callback (the
   * device-auth modal). If so the utility installs a shim in its place that
   * forwards the driver's device-flow notification back over the port.
   */
  hasDeviceFlowNotify?: boolean;
};

export class DataServiceUtility extends DataServiceImpl {
  readonly utilityOptions: UtilityOptions;
  private abortControllers = new Map<number, AbortController>();
  private deviceFlowCallbacks = new Map<
    number,
    { resolve: () => void; reject: (err: unknown) => void }
  >();
  private nextDeviceFlowId = 0;
  constructor(
    utilityOptions: UtilityOptions,
    ...args: ConstructorParameters<typeof DataServiceImpl>
  ) {
    super(...args);
    this._id = utilityOptions.id;
    this.utilityOptions = utilityOptions;

    // Where the renderer registered a real `oidc.notifyDeviceFlow`, install a
    // shim that forwards the driver's device-flow notification over the port
    // and waits for the renderer to run the real (UI) function. They share the
    // same `connectionOptions` object (this is `args[0]`), so the driver's
    // OIDC plugin picks the shim up when `connectMongoClient` reads it.
    const oidc = (args[0] as ConnectionOptions | undefined)?.oidc;
    if (utilityOptions.hasDeviceFlowNotify && oidc) {
      (oidc as { notifyDeviceFlow?: unknown }).notifyDeviceFlow = (info: {
        verificationUrl: string;
        userCode: string;
      }) => this.forwardDeviceFlowNotify(info);
    }

    this.utilityOptions.port.addListener('message', this.onMessage.bind(this));
    this.utilityOptions.port.addListener('close', this.onClose.bind(this));
    this.utilityOptions.port.start();

    // Forward the driver's topology changes so the renderer keeps its derived
    // sync state fresh and can re-emit to its own listeners. Only this event
    // makes the journey today; expand as more are needed.
    this.on(
      'topologyDescriptionChanged',
      (evt: TopologyDescriptionChangedEvent) => {
        const prepared = prepareForTransfer(evt);
        this.utilityOptions.port.postMessage({
          kind: 'event',
          event: 'topologyDescriptionChanged',
          data: prepared.data,
          bsonValues: prepared.bsonValues,
          placeholders: prepared.placeholders,
        });
      }
    );
  }

  private onClose() {
    this.utilityOptions.onClose();
  }

  private forwardDeviceFlowNotify(info: {
    verificationUrl: string;
    userCode: string;
  }): Promise<void> {
    const id = this.nextDeviceFlowId++;
    return new Promise<void>((resolve, reject) => {
      this.deviceFlowCallbacks.set(id, { resolve, reject });
      this.utilityOptions.port.postMessage({
        kind: 'deviceFlow',
        id,
        info,
      });
    });
  }

  private onMessage({ data }: { data: UtilityBoundMessage }) {
    // Result of a forwarded callback invocation (the renderer ran the real
    // notifyDeviceFlow function and is reporting how it went).
    if (data.kind === 'deviceFlow:result') {
      const cb = this.deviceFlowCallbacks.get(data.id);
      if (cb) {
        this.deviceFlowCallbacks.delete(data.id);
        if (data.ok) cb.resolve();
        else cb.reject(data.error);
      }
      return;
    }

    // Special out-of-band message: the renderer's signal aborted, so abort
    // the matching controller created during readTransfer.
    if (data.kind === 'abort') {
      this.abortControllers.get(data.requestId)?.abort();
      return;
    }

    // The remaining kind is a request to dispatch.
    const req: DataServiceRequest = data;
    let args: unknown[];
    let controllers: AbortController[];
    try {
      const result = req.bsonValues
        ? readTransfer(req.args, req.bsonValues, req.placeholders)
        : { data: req.args, controllers: [] };
      args = result.data as unknown[];
      controllers = result.controllers;
    } catch (err) {
      // Never leave the renderer awaiting a response — surface the failure
      // as an error reply instead so the caller rejects rather than hangs.
      this.utilityOptions.port.postMessage({
        kind: 'result',
        responseTo: req.requestId,
        ok: false,
        error: err,
      });
      return;
    }

    if (controllers.length > 0) {
      this.abortControllers.set(req.requestId, controllers[0]);
    }

    try {
      // @ts-expect-error: I am not sure why
      this[req.operation](...args).then(
        (res: any) => {
          this.abortControllers.delete(req.requestId);
          this.onResult(req, res);
        },
        (error: any) => {
          this.abortControllers.delete(req.requestId);
          this.onError(req, error);
        }
      );
    } catch (err) {
      this.abortControllers.delete(req.requestId);
      this.onError(req, err);
    }
  }

  private onResult(req: DataServiceRequest, res: any) {
    const { bsonValues, placeholders } = prepareForTransfer(res);
    this.utilityOptions.port.postMessage({
      kind: 'result',
      responseTo: req.requestId,
      ok: true,
      res,
      bsonValues,
      placeholders,
    });
  }

  private onError(req: DataServiceRequest, error: any) {
    this.utilityOptions.port.postMessage({
      kind: 'result',
      responseTo: req.requestId,
      ok: false,
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
