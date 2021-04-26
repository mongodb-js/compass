import AsyncWriter from '@mongosh/async-rewriter';
import { CommonErrors, MongoshInvalidInputError } from '@mongosh/errors';
import {
  AutoEncryptionOptions,
  ConnectInfo,
  DEFAULT_DB,
  ReplPlatform,
  ServiceProvider,
  TopologyDescription,
  TopologyTypeId
} from '@mongosh/service-provider-core';
import type { ApiEvent, MongoshBus, ConfigProvider, ShellUserConfig } from '@mongosh/types';
import { EventEmitter } from 'events';
import redactInfo from 'mongodb-redact';
import ChangeStreamCursor from './change-stream-cursor';
import { toIgnore } from './decorators';
import { Topologies } from './enums';
import { ShellApiErrors } from './error-codes';
import {
  AggregationCursor,
  Cursor,
  Database,
  getShellApiType,
  Mongo,
  ReplicaSet,
  Shard,
  ShellApi,
  ShellResult,
  signatures,
  toIterator
} from './index';
import NoDatabase from './no-db';
import constructShellBson from './shell-bson';

export interface ShellCliOptions {
  nodb?: boolean;
  mongocryptdSpawnPath?: string;
}

export interface AutocompleteParameters {
  topology: () => Topologies;
  connectionInfo: () => ConnectInfo | undefined;
  getCollectionCompletionsForCurrentDb: (collName: string) => Promise<string[]>;
}

export interface OnLoadResult {
  /**
   * The absolute path of the file that should be load()ed.
   */
  resolvedFilename: string;

  /**
   * The actual steps that are needed to evaluate the load()ed file.
   * For the duration of this call, __filename and __dirname are set as expected.
   */
  evaluate(): Promise<void>;
}

export interface EvaluationListener extends Partial<ConfigProvider<ShellUserConfig>> {
  /**
   * Called when print() or printjson() is run from the shell.
   */
  onPrint?: (value: ShellResult[]) => Promise<void> | void;

  /**
   * Called when e.g. passwordPrompt() is called from the shell.
   */
  onPrompt?: (question: string, type: 'password') => Promise<string> | string;

  /**
   * Called when cls is entered in the shell.
   */
  onClearCommand?: () => Promise<void> | void;

  /**
   * Called when exit/quit is entered in the shell.
   */
  onExit?: () => Promise<never>;

  /**
   * Called when load() is used in the shell.
   */
  onLoad?: (filename: string) => Promise<OnLoadResult> | OnLoadResult;

  /**
   * Called when initiating a connection that uses FLE in the shell.
   * This should start a mongocryptd process and return the relevant options
   * used to access it.
   */
  startMongocryptd?: () => Promise<AutoEncryptionOptions['extraOptions']>;
}

/**
 * Anything to do with the internal shell state is stored here.
 */
export default class ShellInternalState {
  public currentCursor: Cursor | AggregationCursor | ChangeStreamCursor | null;
  public currentDb: Database;
  public messageBus: MongoshBus;
  public asyncWriter: { process(code: string): string };
  public initialServiceProvider: ServiceProvider; // the initial service provider
  public connectionInfo: any;
  public context: any;
  public mongos: Mongo[];
  public shellApi: ShellApi;
  public shellBson: any;
  public cliOptions: ShellCliOptions;
  public evaluationListener: EvaluationListener;
  public mongocryptdSpawnPath: string | null;

  constructor(initialServiceProvider: ServiceProvider, messageBus: any = new EventEmitter(), cliOptions: ShellCliOptions = {}) {
    this.initialServiceProvider = initialServiceProvider;
    this.messageBus = messageBus;
    this.asyncWriter = new AsyncWriter(signatures);
    this.shellApi = new ShellApi(this);
    this.shellBson = constructShellBson(initialServiceProvider.bsonLibrary, (msg: string) => {
      if (this.context.print) {
        this.context.print(`Warning: ${msg}`);
      }
    });
    this.mongos = [];
    this.connectionInfo = { buildInfo: {} };
    if (!cliOptions.nodb) {
      const mongo = new Mongo(this, undefined, undefined, undefined, initialServiceProvider);
      this.mongos.push(mongo);
      this.currentDb = mongo.getDB(initialServiceProvider.initialDb || DEFAULT_DB);
    } else {
      this.currentDb = new NoDatabase() as Database;
    }
    this.currentCursor = null;
    this.context = {};
    this.cliOptions = cliOptions;
    this.evaluationListener = {};
    this.mongocryptdSpawnPath = cliOptions.mongocryptdSpawnPath ?? null;
  }

  async fetchConnectionInfo(): Promise<void> {
    if (!this.cliOptions.nodb) {
      this.connectionInfo = await this.currentDb._mongo._serviceProvider.getConnectionInfo();
      this.messageBus.emit('mongosh:connect', {
        ...this.connectionInfo.extraInfo,
        uri: redactInfo(this.connectionInfo.extraInfo.uri)
      });
    }
  }

  async close(force: boolean): Promise<void> {
    for (const mongo of [...this.mongos]) {
      await mongo.close(force);
    }
  }

  public setDbFunc(newDb: any): Database {
    this.currentDb = newDb;
    this.context.rs = new ReplicaSet(this.currentDb);
    this.context.sh = new Shard(this.currentDb);
    this.fetchConnectionInfo().catch(err => this.messageBus.emit('mongosh:error', err));
    // Pre-fetch for autocompletion.
    this.currentDb._getCollectionNamesForCompletion().catch(err => this.messageBus.emit('mongosh:error', err));
    return newDb;
  }

  /**
   * Prepare a `contextObject` as global context and set it as context
   * Add each attribute to the AsyncWriter also.
   *
   * The `contextObject` is prepared so that it can be used as global object
   * for the repl evaluation.
   *
   * @note The `contextObject` is mutated, it will retain all of its existing
   * properties but also have the global shell api objects and functions.
   *
   * @param {Object} contextObject - contextObject an object used as global context.
   */
  setCtx(contextObject: any): void {
    this.context = contextObject;
    contextObject.toIterator = toIterator;
    Object.assign(contextObject, this.shellApi);
    for (const name of Object.getOwnPropertyNames(ShellApi.prototype)) {
      if (toIgnore.concat(['hasAsyncChild', 'help']).includes(name) ||
        typeof (this.shellApi as any)[name] !== 'function') {
        continue;
      }
      contextObject[name] = (...args: any[]): any => {
        return (this.shellApi as any)[name](...args);
      };
      contextObject[name].help = (this.shellApi as any)[name].help;
    }
    contextObject.help = this.shellApi.help;
    Object.assign(contextObject, this.shellBson);
    if (contextObject.console === undefined) {
      contextObject.console = {};
    }
    for (const key of ['log', 'warn', 'info', 'error']) {
      contextObject.console[key] = async(...args: any[]): Promise<void> => {
        return await contextObject.print(...args);
      };
    }
    contextObject.console.clear = contextObject.cls;

    contextObject.rs = new ReplicaSet(this.currentDb);
    contextObject.sh = new Shard(this.currentDb);

    // Add global shell objects
    const apiObjects = {
      db: signatures.Database,
      rs: signatures.ReplicaSet,
      sh: signatures.Shard,
      config: signatures.ShellConfig
    } as any;
    Object.assign(apiObjects, signatures.ShellApi.attributes);
    delete apiObjects.Mongo;
    // eslint-disable-next-line chai-friendly/no-unused-expressions
    (this.asyncWriter as any)?.symbols?.initializeApiObjects(apiObjects);

    const setFunc = (newDb: any): Database => {
      if (getShellApiType(newDb) !== 'Database') {
        throw new MongoshInvalidInputError('Cannot reassign \'db\' to non-Database type', CommonErrors.InvalidOperation);
      }
      return this.setDbFunc(newDb);
    };

    if (this.initialServiceProvider.platform === ReplPlatform.JavaShell) {
      contextObject.db = this.setDbFunc(this.currentDb); // java shell, can't use getters/setters
    } else {
      Object.defineProperty(contextObject, 'db', {
        configurable: true,
        set: setFunc,
        get: () => (this.currentDb)
      });
    }

    this.messageBus.emit(
      'mongosh:setCtx',
      { method: 'setCtx', arguments: {} }
    );
  }

  get currentServiceProvider(): ServiceProvider {
    try {
      return this.currentDb._mongo._serviceProvider;
    } catch (err) {
      if (err.code === ShellApiErrors.NotConnected) {
        return this.initialServiceProvider;
      }
      throw err;
    }
  }

  public emitApiCall(event: ApiEvent): void {
    this.messageBus.emit('mongosh:api-call', event);
  }

  public setEvaluationListener(listener: EvaluationListener): void {
    this.evaluationListener = listener;
  }

  public getAutocompleteParameters(): AutocompleteParameters {
    return {
      // eslint-disable-next-line complexity
      topology: () => {
        let topology: Topologies;
        const topologyDescription = this.currentServiceProvider.getTopology()?.description as TopologyDescription;
        const topologyType: TopologyTypeId | undefined = topologyDescription?.type;
        switch (topologyType) {
          case 'ReplicaSetNoPrimary':
          case 'ReplicaSetWithPrimary':
            topology = Topologies.ReplSet;
            break;
          case 'Sharded':
            topology = Topologies.Sharded;
            break;
          default:
            topology = Topologies.Standalone;
            // We're connected to a single server, but that doesn't necessarily
            // mean that that server isn't part of a replset or sharding setup
            // if we're using directConnection=true (which we do by default).
            if (topologyDescription.servers.size === 1) {
              const [ server ] = topologyDescription.servers.values();
              switch (server.type) {
                case 'Mongos':
                  topology = Topologies.Sharded;
                  break;
                case 'PossiblePrimary':
                case 'RSPrimary':
                case 'RSSecondary':
                case 'RSArbiter':
                case 'RSOther':
                case 'RSGhost':
                  topology = Topologies.ReplSet;
                  break;
                default:
                  // Either Standalone, Unknown, or something so unknown that
                  // it isn't even listed in the enum right now.
                  break;
              }
            }
            break;
        }
        return topology;
      },
      connectionInfo: () => {
        return this.connectionInfo.extraInfo;
      },
      getCollectionCompletionsForCurrentDb: async(collName: string): Promise<string[]> => {
        try {
          const collectionNames = await this.currentDb._getCollectionNamesForCompletion();
          return collectionNames.filter((name) => name.startsWith(collName));
        } catch (err) {
          if (err.code === ShellApiErrors.NotConnected) {
            return [];
          }
          throw err;
        }
      }
    };
  }

  async getDefaultPrompt(): Promise<string> {
    return `${this.getDefaultPromptPrefix()}${this.getTopologySpecificPrompt()}> `;
  }

  private getDefaultPromptPrefix(): string {
    const extraConnectionInfo = this.connectionInfo?.extraInfo;
    if (extraConnectionInfo?.is_data_lake) {
      return 'Atlas Data Lake ';
    } else if (extraConnectionInfo?.is_enterprise || this.connectionInfo?.buildInfo?.modules?.indexOf('enterprise') >= 0) {
      return 'Enterprise ';
    }
    return '';
  }

  private getTopologySpecificPrompt(): string {
    const description = this.currentServiceProvider.getTopology()?.description;
    if (!description) {
      return '';
    }

    let replicaSet = description.setName;
    let serverTypePrompt = '';
    // TODO: replace with proper TopologyType constants - NODE-2973
    switch (description.type) {
      case 'Single':
        const singleDetails = this.getTopologySinglePrompt(description);
        replicaSet = singleDetails?.replicaSet ?? replicaSet;
        serverTypePrompt = singleDetails?.serverType ? `[direct: ${singleDetails.serverType}]` : '';
        break;
      case 'ReplicaSetNoPrimary':
        serverTypePrompt = '[secondary]';
        break;
      case 'ReplicaSetWithPrimary':
        serverTypePrompt = '[primary]';
        break;
      case 'Sharded':
        serverTypePrompt = this.connectionInfo?.extraInfo?.atlas_version ? '' : '[mongos]';
        break;
      default:
        return '';
    }

    const setNamePrefix = replicaSet ? `${replicaSet} ` : '';
    return `${setNamePrefix}${serverTypePrompt}`;
  }

  private getTopologySinglePrompt(description: TopologyDescription): {replicaSet: string | undefined, serverType: string} | undefined {
    if (description.servers?.size !== 1) {
      return undefined;
    }
    const [server] = description.servers.values();

    // TODO: replace with proper ServerType constants - NODE-2973
    let serverType: string;
    switch (server.type) {
      case 'Mongos':
        serverType = 'mongos';
        break;
      case 'RSPrimary':
        serverType = 'primary';
        break;
      case 'RSSecondary':
        serverType = 'secondary';
        break;
      case 'RSArbiter':
        serverType = 'arbiter';
        break;
      case 'RSOther':
        serverType = 'other';
        break;
      case 'Standalone':
      case 'PossiblePrimary':
      case 'RSGhost':
      case 'Unknown':
      default:
        serverType = '';
    }

    return {
      replicaSet: server.setName,
      serverType
    };
  }
}
