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
import type {
  DatabaseStats,
  DataServiceEventMap,
  ExecutionOptionsWithFallbackReadPreference,
  SampleOptions,
  StreamProcessor,
  UpdatePreview,
} from './data-service';
import {
  type DataService,
  type CSFLEMode,
  type MongoClientConnectionOptions,
} from './data-service';
import {
  DATA_SERVICE_PORT_CHANNEL,
  type DataServiceRequest,
  type OperationName,
  type RendererBoundMessage,
} from './protocol';
import { prepareForTransfer, readTransfer } from './transfer';
import type { AnalyzeSchemaArgs } from './cursor/analyze-schema';
import type {
  ExportToFileArgs,
  ExportToFileResult,
} from './cursor/export-to-file';
import type {
  GatherFieldsArgs,
  GatherFieldsResult,
} from './cursor/gather-fields';
import type { Schema } from '@mongodb-js/mongodb-schema';
import type { Document } from 'bson';
import type {
  TopologyType,
  TopologyDescription,
  TopologyDescriptionChangedEvent,
  AggregateOptions,
  Abortable,
  AggregationCursor,
  Filter,
  FindOptions,
  FindCursor,
} from 'mongodb';
import type ConnectionString from 'mongodb-connection-string-url';
import type { ReauthenticationHandler } from './connect-mongo-client';
import type { ConnectionOptions } from './connection-options';
import { isCancelError } from '@mongodb-js/compass-utils';
import type { DataServiceImplLogger } from './logger';
import type { DevtoolsProxyOptions } from '@mongodb-js/devtools-proxy-support';
import ConnectionStringUrl from 'mongodb-connection-string-url';
import { configuredKMSProviders } from './instance-detail-helper';

let reqId = 0;
let nextId = 0;

/**
 * Mirrors the driver's `WRITABLE_SERVER_TYPES`. ServerDescription objects that
 * arrive over the port are degraded plain objects with their data properties
 * (`type`, `address`, ...) but without the prototype `isWritable` getter, so it
 * is derived from each server's `type` instead.
 */
const WRITABLE_SERVER_TYPES = new Set<string>([
  'RSPrimary',
  'Standalone',
  'Mongos',
]);

export class DataServiceRenderer
  // extends DataServiceImpl
  implements DataService
{
  /** */
  private portToUtility: MessagePort;
  private pending: Map<number, PromiseWithResolvers<any>> = new Map();
  private abortCleanup: Map<number, () => void> = new Map();
  /**
   * Connection state as known from the utility process. The renderer's own
   * `DataServiceImpl` never connects (connect is proxied), so `super.isConnected()`
   * would always be false — gate callers like the CRUD query runner rely on
   * this reporting the real connection status.
   */
  private connected = false;
  /**
   * Client options captured from the utility's `connect()` return (already in
   * the oidc-omitted, clone-safe form). The renderer's own `_crudClient` never
   * exists, so `getMongoClientConnectionOptions()` can't read it off the client.
   */
  private mongoClientConnectionOptions:
    | MongoClientConnectionOptions
    | undefined;
  /**
   * Mirror of the utility's `_useCRUDClient`, toggled by `setCSFLEEnabled`.
   * Derives `getCSFLEMode()` locally since `checkIsCSFLEConnection` can't see
   * the renderer's (nonexistent) `_crudClient`.
   */
  private useCRUDClient = true;

  readonly id: number;

  /**
   * The real `oidc.notifyDeviceFlow` function from the connection options —
   * opens the device-auth modal. Lives only on the renderer (it captures
   * connections UI state); the utility shims it and forwards driver calls here.
   */
  private deviceFlowNotify:
    | ((info: {
        verificationUrl: string;
        userCode: string;
      }) => void | Promise<void>)
    | undefined;

  private readonly connectionOptions: Readonly<ConnectionOptions>;
  private readonly logger?: DataServiceImplLogger;
  private readonly proxyOptions?: DevtoolsProxyOptions;
  private writable: boolean = false;
  private lastSeenTopology: TopologyDescription | null = null;

  constructor(
    connectionOptions: Readonly<ConnectionOptions>,
    logger?: DataServiceImplLogger,
    proxyOptions?: DevtoolsProxyOptions
  ) {
    // super(...args);
    this.id = ++nextId;
    this.connectionOptions = connectionOptions;
    this.logger = logger;
    this.proxyOptions = proxyOptions;
    this.deviceFlowNotify = (
      this.getConnectionOptions().oidc as
        | {
            notifyDeviceFlow?: (info: {
              verificationUrl: string;
              userCode: string;
            }) => void | Promise<void>;
          }
        | undefined
    )?.notifyDeviceFlow;

    const channel = new MessageChannel();
    this.portToUtility = channel.port1;
    this.portToUtility.addEventListener('message', this.onMessage.bind(this));
    this.portToUtility.start();

    const bootMessage = {
      type: DATA_SERVICE_PORT_CHANNEL,
      id: this.id,
      // `notifyDeviceFlow` is a function and can't be structured-cloned; the
      // marker tells the utility a callback exists so it can install a shim.
      hasDeviceFlowNotify: !!this.deviceFlowNotify,
      connectionOptions: omit(
        this.getConnectionOptions(),
        'oidc.notifyDeviceFlow'
      ),
    };

    globalThis.postMessage(bootMessage, '*', [channel.port2]);
  }

  private send(
    msgInit: Pick<DataServiceRequest, 'operation' | 'args'>
  ): number {
    const requestId = reqId++;
    const { bsonValues, signals, placeholders } = prepareForTransfer(
      msgInit.args
    );
    const message: DataServiceRequest = {
      kind: 'request',
      requestId,
      operation: msgInit.operation,
      args: msgInit.args,
      bsonValues,
      placeholders,
    };

    // Wire up abort propagation: when the caller's signal fires, tell the
    // utility to abort its controller for this request. `{ once: true }`
    // auto-removes the listener after firing; we also store a cleanup
    // function so the listener can be removed if the response arrives
    // before the signal fires.
    if (signals.length > 0) {
      const signal = signals[0];
      const handler = () => {
        this.portToUtility.postMessage({ kind: 'abort', requestId });
      };
      signal.addEventListener('abort', handler, { once: true });
      this.abortCleanup.set(requestId, () =>
        signal.removeEventListener('abort', handler)
      );
    }

    this.portToUtility.postMessage(message);
    this.pending.set(requestId, Promise.withResolvers());
    return requestId;
  }

  private onMessage({ data }: MessageEvent<RendererBoundMessage>) {
    // The utility forwarded a driver-side callback invocation (OIDC device
    // flow): run the real renderer function and report the result back.
    if (data.kind === 'deviceFlow') {
      Promise.resolve(this.deviceFlowNotify?.(data.info)).then(
        () => {
          this.portToUtility.postMessage({
            kind: 'deviceFlow:result',
            id: data.id,
            ok: true,
          });
        },
        (error) => {
          this.portToUtility.postMessage({
            kind: 'deviceFlow:result',
            id: data.id,
            ok: false,
            error,
          });
        }
      );
      return;
    }

    // The utility forwarded a driver event (e.g. topologyDescriptionChanged):
    // unbox it and deliver to listeners (and keep derived sync state fresh).
    if (data.kind === 'event') {
      const { data: eventData } = readTransfer(
        data.data,
        data.bsonValues,
        data.placeholders
      );
      this.deliverEvent(data.event, eventData);
      return;
    }

    const resolvers = this.pending.get(data.responseTo);
    // Clean up abort listener (no-op if none was registered).
    this.abortCleanup.get(data.responseTo)?.();
    this.abortCleanup.delete(data.responseTo);
    this.pending.delete(data.responseTo);
    if (data.ok) {
      const { data: res } = readTransfer(
        data.res,
        data.bsonValues,
        data.placeholders
      );
      resolvers?.resolve(res);
    } else {
      resolvers?.reject(data.error);
    }
  }

  private async do(operation: OperationName, args: unknown[]) {
    return await this.pending.get(this.send({ operation, args }))?.promise;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async connect(options?: {
    signal?: AbortSignal;
    productName?: string;
    productDocsLink?: string;
  }): Promise<MongoClientConnectionOptions | undefined> {
    const connectionOptions = await this.do('connect', [options]);
    this.connected = true;
    if (connectionOptions) {
      this.mongoClientConnectionOptions =
        connectionOptions as MongoClientConnectionOptions;
    }
    return this.mongoClientConnectionOptions;
  }

  getMongoClientConnectionOptions(): MongoClientConnectionOptions | undefined {
    // Captured from the utility's `connect()` return, which is already the
    // oidc-omitted form (functions can't cross the port).
    return this.mongoClientConnectionOptions;
  }

  getCSFLEMode(): CSFLEMode {
    // The renderer's own `_crudClient` never exists (connect is proxied), so
    // derive from constructor state via `configuredKMSProviders()` — the same
    // input the real impl's `checkIsCSFLEConnection` reads off the connected
    // client.
    if (!this.connected || this.configuredKMSProviders().length === 0) {
      return 'unavailable';
    }
    return this.useCRUDClient ? 'enabled' : 'disabled';
  }

  setCSFLEEnabled(enabled: boolean): void {
    this.useCRUDClient = enabled;
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
    try {
      return await this.do('disconnect', args);
    } finally {
      this.connected = false;
    }
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
  async isUpdateAllowed(...args: Parameters<DataService['isUpdateAllowed']>) {
    return await this.do('isUpdateAllowed', args);
  }
  async knownSchemaForCollection(
    ...args: Parameters<DataService['knownSchemaForCollection']>
  ) {
    return await this.do('knownSchemaForCollection', args);
  }
  async getUpdatedSecrets(
    ...args: Parameters<DataService['getUpdatedSecrets']>
  ) {
    return await this.do('getUpdatedSecrets', args);
  }
  async listStreamProcessors(
    ...args: Parameters<DataService['listStreamProcessors']>
  ): Promise<StreamProcessor[]> {
    return await this.do('listStreamProcessors', args);
  }
  async startStreamProcessor(
    ...args: Parameters<DataService['startStreamProcessor']>
  ): Promise<void> {
    return await this.do('startStreamProcessor', args);
  }
  async stopStreamProcessor(
    ...args: Parameters<DataService['stopStreamProcessor']>
  ): Promise<void> {
    return await this.do('stopStreamProcessor', args);
  }
  async dropStreamProcessor(
    ...args: Parameters<DataService['dropStreamProcessor']>
  ): Promise<void> {
    return await this.do('dropStreamProcessor', args);
  }
  async databaseStats(
    ...args: Parameters<DataService['databaseStats']>
  ): Promise<DatabaseStats> {
    return await this.do('databaseStats', args);
  }
  async createDataKey(
    ...args: Parameters<DataService['createDataKey']>
  ): Promise<Document> {
    return await this.do('createDataKey', args);
  }
  async previewUpdate(
    ...args: Parameters<DataService['previewUpdate']>
  ): Promise<UpdatePreview> {
    return await this.do('previewUpdate', args);
  }
  async analyzeSchema(args: AnalyzeSchemaArgs): Promise<Schema | undefined> {
    return await this.do('analyzeSchema', [args]);
  }
  async exportToFile(args: ExportToFileArgs): Promise<ExportToFileResult> {
    return await this.do('exportToFile', [args]);
  }
  async gatherFields(args: GatherFieldsArgs): Promise<GatherFieldsResult> {
    return await this.do('gatherFields', [args]);
  }

  private target = new EventTarget();
  private listenerToWrapper = new Map<
    DataServiceEventMap[keyof DataServiceEventMap],
    EventListenerOrEventListenerObject
  >();
  on<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this {
    function wrapped(evt: Event) {
      // The payload only exists because deliverEvent stamped it onto the
      // Event; it crosses the port as `unknown`, so invoke through that.
      (listener as unknown as (data: unknown) => void)(
        (evt as unknown as { data: unknown }).data
      );
    }
    this.target.addEventListener(event, wrapped);
    this.listenerToWrapper.set(listener, wrapped);
    return this;
  }
  off<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this {
    this.removeListener(event, listener);
    return this;
  }
  removeListener<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this {
    this.target.removeEventListener(
      event,
      this.listenerToWrapper.get(listener) ?? null
    );
    this.listenerToWrapper.delete(listener);
    return this;
  }
  once<K extends keyof DataServiceEventMap>(
    event: K,
    listener: DataServiceEventMap[K]
  ): this {
    const wrapped = (evt: Event) => {
      (listener as unknown as (data: unknown) => void)(
        (evt as unknown as { data: unknown }).data
      );
      this.listenerToWrapper.delete(listener);
    };
    this.target.addEventListener(event, wrapped, { once: true });
    return this;
  }

  /**
   * Unboxes a forwarded driver event and fires it: updates derived sync state
   * (topology/writable) and dispatches to local listeners, with the payload
   * boxed into the Event's `data` so the wrappers above can unwrap it.
   */
  private deliverEvent<K extends keyof DataServiceEventMap>(
    event: K,
    data: unknown
  ): void {
    if (event === 'topologyDescriptionChanged') {
      const evt = data as TopologyDescriptionChangedEvent;
      this.lastSeenTopology = evt.newDescription;
      // `isWritable` is a prototype getter the degraded objects don't carry;
      // derive it from each server's `type`.
      this.writable = [...evt.newDescription.servers.values()].some((server) =>
        WRITABLE_SERVER_TYPES.has(server.type)
      );
    }
    // Box the payload so `on`/`once` wrappers read it off `evt.data`.
    const eventObj = new (class extends Event {
      data = data;
    })(event);
    this.target.dispatchEvent(eventObj);
  }

  getConnectionOptions(): Readonly<ConnectionOptions> {
    return this.connectionOptions;
  }
  getConnectionString(): ConnectionString {
    return new ConnectionStringUrl(this.connectionOptions.connectionString);
  }
  getCurrentTopologyType(): TopologyType {
    return this.getLastSeenTopology()?.type ?? 'Unknown';
  }
  getLastSeenTopology(): TopologyDescription | null {
    return this.lastSeenTopology;
  }
  isWritable(): boolean {
    return this.writable;
  }
  isMongos(): boolean {
    return this.getCurrentTopologyType() === 'Sharded';
  }
  isCancelError(error: unknown): error is Error {
    return isCancelError(error);
  }
  configuredKMSProviders(): string[] {
    return configuredKMSProviders(
      this.connectionOptions.fleOptions?.autoEncryption
    );
  }

  /// WIP

  addReauthenticationHandler(_handler: ReauthenticationHandler): void {
    // throw new Error('Method not implemented.');
    console.error('I am lying');
  }

  aggregateCursor(
    _ns: string,
    _pipeline: Document[],
    _options?: AggregateOptions & Abortable
  ): AggregationCursor {
    throw new Error('Method not implemented.');
  }
  findCursor(
    _ns: string,
    _filter: Filter<Document>,
    _options?: FindOptions
  ): FindCursor {
    throw new Error('Method not implemented.');
  }
  sampleCursor(
    _ns: string,
    _args?: SampleOptions,
    _options?: AggregateOptions & Abortable,
    _executionOptions?: ExecutionOptionsWithFallbackReadPreference
  ): AggregationCursor {
    throw new Error('Method not implemented.');
  }
}
