import {
  shellApiClassDefault,
  hasAsyncChild,
  ShellApiClass,
  returnsPromise,
  returnType,
  platforms,
  toShellResult,
  ShellResult,
  directShellCommand
} from './decorators';
import { asPrintable } from './enums';
import Mongo from './mongo';
import Database from './database';
import { CommandResult, CursorIterationResult } from './result';
import ShellInternalState from './shell-internal-state';
import { assertArgsDefinedType, assertCLI } from './helpers';
import { DEFAULT_DB, ReplPlatform, ServerApi, ServerApiVersionId } from '@mongosh/service-provider-core';
import { CommonErrors, MongoshUnimplementedError, MongoshInternalError } from '@mongosh/errors';
import { DBQuery } from './deprecated';
import { promisify } from 'util';
import { ClientSideFieldLevelEncryptionOptions } from './field-level-encryption';
import { dirname } from 'path';
import { ShellUserConfig } from '@mongosh/types';
import i18n from '@mongosh/i18n';

const internalStateSymbol = Symbol.for('@@mongosh.internalState');

@shellApiClassDefault
@hasAsyncChild
class ShellConfig extends ShellApiClass {
  _internalState: ShellInternalState;
  defaults: Readonly<ShellUserConfig>;

  constructor(internalState: ShellInternalState) {
    super();
    this._internalState = internalState;
    this.defaults = Object.freeze(new ShellUserConfig());
  }

  @returnsPromise
  async set<K extends keyof ShellUserConfig>(key: K, value: ShellUserConfig[K]): Promise<string> {
    assertArgsDefinedType([key], ['string'], 'config.set');
    const { evaluationListener } = this._internalState;
    const result = await evaluationListener.setConfig?.(key, value);
    if (result !== 'success') {
      return `Option "${key}" is not available in this environment`;
    }

    return `Setting "${key}" has been changed`;
  }

  @returnsPromise
  async get<K extends keyof ShellUserConfig>(key: K): Promise<ShellUserConfig[K]> {
    assertArgsDefinedType([key], ['string'], 'config.get');
    const { evaluationListener } = this._internalState;
    return await evaluationListener.getConfig?.(key) ?? this.defaults[key];
  }

  async [asPrintable](): Promise<Map<keyof ShellUserConfig, ShellUserConfig[keyof ShellUserConfig]>> {
    const { evaluationListener } = this._internalState;
    const keys = (await evaluationListener.listConfigOptions?.() ?? Object.keys(this.defaults)) as (keyof ShellUserConfig)[];
    return new Map(
      await Promise.all(
        keys.map(
          async key => [key, await this.get(key)] as const)));
  }
}

@shellApiClassDefault
@hasAsyncChild
export default class ShellApi extends ShellApiClass {
  // Use a symbol to make sure this is *not* one of the things copied over into
  // the global scope.
  [internalStateSymbol]: ShellInternalState;
  public DBQuery: DBQuery;
  loadCallNestingLevel: number;
  config: ShellConfig;

  constructor(internalState: ShellInternalState) {
    super();
    this[internalStateSymbol] = internalState;
    this.DBQuery = new DBQuery();
    this.loadCallNestingLevel = 0;
    this.config = new ShellConfig(internalState);
  }

  get internalState(): ShellInternalState {
    return this[internalStateSymbol];
  }

  @directShellCommand
  use(db: string): any {
    return this.internalState.currentDb._mongo.use(db);
  }

  @directShellCommand
  @returnsPromise
  async show(cmd: string, arg?: string): Promise<CommandResult> {
    return await this.internalState.currentDb._mongo.show(cmd, arg);
  }

  @directShellCommand
  @returnsPromise
  @platforms([ ReplPlatform.CLI ] )
  async exit(): Promise<never> {
    assertCLI(this.internalState.initialServiceProvider.platform, 'the exit/quit commands');
    await this.internalState.close(true);
    // This should never actually return.
    await this.internalState.evaluationListener.onExit?.();
    throw new MongoshInternalError('.onExit listener returned');
  }

  @directShellCommand
  @returnsPromise
  @platforms([ ReplPlatform.CLI ] )
  async quit(): Promise<never> {
    return await this.exit();
  }

  @returnsPromise
  @returnType('Mongo')
  @platforms([ ReplPlatform.CLI ] )
  public async Mongo(
    uri?: string,
    fleOptions?: ClientSideFieldLevelEncryptionOptions,
    otherOptions?: { api?: ServerApi | ServerApiVersionId }): Promise<Mongo> {
    assertCLI(this.internalState.initialServiceProvider.platform, 'new Mongo connections');
    const mongo = new Mongo(this.internalState, uri, fleOptions, otherOptions);
    await mongo.connect();
    this.internalState.mongos.push(mongo);
    return mongo;
  }

  @returnsPromise
  @returnType('Database')
  @platforms([ ReplPlatform.CLI ] )
  async connect(uri: string, user?: string, pwd?: string): Promise<Database> {
    assertArgsDefinedType([uri, user, pwd], ['string', [undefined, 'string'], [undefined, 'string']], 'connect');
    assertCLI(this.internalState.initialServiceProvider.platform, 'new Mongo connections');
    const mongo = new Mongo(this.internalState, uri);
    await mongo.connect(user, pwd);
    this.internalState.mongos.push(mongo);
    const db = mongo._serviceProvider.initialDb || DEFAULT_DB;
    return mongo.getDB(db);
  }

  @directShellCommand
  @returnsPromise
  async it(): Promise<any> {
    if (!this.internalState.currentCursor) {
      return new CursorIterationResult();
    }
    return await this.internalState.currentCursor._it();
  }

  version(): string {
    const version = require('../package.json').version;
    return version;
  }

  @returnsPromise
  async load(filename: string): Promise<true> {
    assertArgsDefinedType([filename], ['string'], 'load');
    if (!this.internalState.evaluationListener.onLoad) {
      throw new MongoshUnimplementedError(
        'load is not currently implemented for this platform',
        CommonErrors.NotImplemented
      );
    }
    this.internalState.messageBus.emit('mongosh:api-load-file', {
      nested: this.loadCallNestingLevel > 0,
      filename
    });
    const {
      resolvedFilename, evaluate
    } = await this.internalState.evaluationListener.onLoad(filename);

    const context = this.internalState.context;
    const previousFilename = context.__filename;
    context.__filename = resolvedFilename;
    context.__dirname = dirname(resolvedFilename);
    this.loadCallNestingLevel++;
    try {
      await evaluate();
    } finally {
      this.loadCallNestingLevel--;
      if (previousFilename) {
        context.__filename = previousFilename;
        context.__dirname = dirname(previousFilename);
      } else {
        delete context.__filename;
        delete context.__dirname;
      }
    }
    return true;
  }

  @returnsPromise
  @platforms([ ReplPlatform.CLI ] )
  async enableTelemetry(): Promise<any> {
    const result = await this.internalState.evaluationListener.setConfig?.('enableTelemetry', true);
    if (result === 'success') {
      return i18n.__('cli-repl.cli-repl.enabledTelemetry');
    }
  }

  @returnsPromise
  @platforms([ ReplPlatform.CLI ] )
  async disableTelemetry(): Promise<any> {
    const result = await this.internalState.evaluationListener.setConfig?.('enableTelemetry', false);
    if (result === 'success') {
      return i18n.__('cli-repl.cli-repl.disabledTelemetry');
    }
  }

  @returnsPromise
  @platforms([ ReplPlatform.CLI ] )
  async passwordPrompt(): Promise<string> {
    const { evaluationListener } = this.internalState;
    if (!evaluationListener.onPrompt) {
      throw new MongoshUnimplementedError('passwordPrompt() is not available in this shell', CommonErrors.NotImplemented);
    }
    return await evaluationListener.onPrompt('Enter password', 'password');
  }

  @returnsPromise
  async sleep(ms: number): Promise<void> {
    return await promisify(setTimeout)(ms);
  }

  @returnsPromise
  async print(...origArgs: any[]): Promise<void> {
    const { evaluationListener } = this.internalState;
    const args: ShellResult[] =
      await Promise.all(origArgs.map(arg => toShellResult(arg)));
    await evaluationListener.onPrint?.(args);
  }

  @returnsPromise
  async printjson(...origArgs: any[]): Promise<void> {
    return this.print(...origArgs);
  }

  @directShellCommand
  @returnsPromise
  async cls(): Promise<void> {
    const { evaluationListener } = this.internalState;
    await evaluationListener.onClearCommand?.();
  }
}
