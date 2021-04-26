/* eslint complexity: 0, no-use-before-define: 0 */
import type {
  DbOptions,
  Document,
  ExplainVerbosityLike,
  FindCursor,
  AggregationCursor as SPAggregationCursor,
  FindAndModifyOptions,
  DeleteOptions,
  MapReduceOptions,
  ChangeStream,
  KMSProviders,
  ExplainOptions
} from '@mongosh/service-provider-core';
import { CommonErrors, MongoshInvalidInputError, MongoshUnimplementedError } from '@mongosh/errors';
import crypto from 'crypto';
import type Database from './database';
import type Collection from './collection';
import { CursorIterationResult } from './result';
import { ShellApiErrors } from './error-codes';
import { BinaryType, ReplPlatform } from '@mongosh/service-provider-core';
import { ClientSideFieldLevelEncryptionOptions } from './field-level-encryption';
import { AutoEncryptionOptions } from 'mongodb';
import { shellApiType } from './enums';

/**
 * Helper method to adapt aggregation pipeline options.
 * This is here so that it's not visible to the user.
 *
 * @param options
 */
export function adaptAggregateOptions(options: any = {}): {
  aggOptions: Document;
  dbOptions: DbOptions;
  explain?: ExplainVerbosityLike & string;
} {
  const aggOptions = { ...options };

  const dbOptions: DbOptions = {};
  let explain;

  if ('readConcern' in aggOptions) {
    dbOptions.readConcern = options.readConcern;
    delete aggOptions.readConcern;
  }

  if ('writeConcern' in aggOptions) {
    Object.assign(dbOptions, options.writeConcern);
    delete aggOptions.writeConcern;
  }

  if ('explain' in aggOptions) {
    explain = validateExplainableVerbosity(aggOptions.explain);
    delete aggOptions.explain;
  }

  return { aggOptions, dbOptions, explain };
}

export function validateExplainableVerbosity(verbosity: ExplainVerbosityLike): ExplainVerbosityLike & string {
  // Legacy shell behavior.
  if (verbosity === true) {
    verbosity = 'allPlansExecution';
  } else if (verbosity === false) {
    verbosity = 'queryPlanner';
  }

  const allowedVerbosity = [
    'queryPlanner',
    'executionStats',
    'allPlansExecution'
  ];

  if (!allowedVerbosity.includes(verbosity as string)) {
    throw new MongoshInvalidInputError(
      `verbosity can only be one of ${allowedVerbosity.join(', ')}. Received ${verbosity}.`,
      CommonErrors.InvalidArgument
    );
  }

  return verbosity;
}

function getAssertCaller(caller?: string): string {
  return caller ? ` (${caller})` : '';
}

export function assertArgsDefinedType(args: any[], expectedTypes: Array<true|string|Array<string | undefined>>, func?: string): void {
  args.forEach((arg, i) => {
    const expected = expectedTypes[i];
    if (arg === undefined) {
      if (expected !== true && Array.isArray(expected) && expected.includes(undefined)) {
        return;
      }
      throw new MongoshInvalidInputError(
        `Missing required argument at position ${i}${getAssertCaller(func)}`,
        CommonErrors.InvalidArgument
      );
    } else if (expected === true) {
      return;
    }

    if (((typeof expected === 'string' && typeof arg !== expected) || !expected.includes(typeof arg))) {
      const expectedMsg = typeof expected === 'string' ? expected : expected.filter(e => e !== undefined).join(' or ');
      throw new MongoshInvalidInputError(
        `Argument at position ${i} must be of type ${expectedMsg}, got ${typeof arg} instead${getAssertCaller(func)}`,
        CommonErrors.InvalidArgument
      );
    }
  });
}

export function assertKeysDefined(object: any, keys: string[]): void {
  for (const key of keys) {
    if (object[key] === undefined) {
      throw new MongoshInvalidInputError(`Missing required property: ${JSON.stringify(key)}`, CommonErrors.InvalidArgument);
    }
  }
}

/**
 * Helper method to adapt objects that are slightly different from Shell to SP API.
 *
 * @param {Object} shellToCommand - a map of the shell key to the command key. If null, then omit.
 * @param {Object} shellDoc - the document to be adapted
 */
export function adaptOptions(shellToCommand: any, additions: any, shellDoc: any): any {
  return Object.keys(shellDoc).reduce((result, shellKey) => {
    if (shellToCommand[shellKey] === null) {
      return result;
    }
    result[ shellToCommand[shellKey] || shellKey ] = shellDoc[shellKey];
    return result;
  }, additions);
}

/**
 * Optionally digest password if passwordDigestor field set to 'client'. If it's false,
 * then hash the password.
 *
 * @param username
 * @param passwordDigestor
 * @param {Object} command
 */
export function processDigestPassword(
  username: string,
  passwordDigestor: 'server' | 'client',
  command: { pwd: string }): { digestPassword?: boolean; pwd?: string } {
  if (passwordDigestor === undefined) {
    return {};
  }
  if (passwordDigestor !== 'server' && passwordDigestor !== 'client') {
    throw new MongoshInvalidInputError(
      `Invalid field: passwordDigestor must be 'client' or 'server', got ${passwordDigestor}`,
      CommonErrors.InvalidArgument
    );
  }
  if (passwordDigestor === 'client') {
    if (typeof command.pwd !== 'string') {
      throw new MongoshInvalidInputError(
        `User passwords must be of type string. Was given password with type ${typeof command.pwd}`,
        CommonErrors.InvalidArgument
      );
    }
    const hash = crypto.createHash('md5');
    hash.update(`${username}:mongo:${command.pwd}`);
    const digested = hash.digest('hex');
    return { digestPassword: false, pwd: digested };
  }
  return { digestPassword: true };
}


/**
 * Return an object which will become a ShardingStatusResult
 * @param mongo
 * @param configDB
 * @param verbose
 */
export async function getPrintableShardStatus(db: Database, verbose: boolean): Promise<any> {
  const result = {} as any; // use array to maintain order

  // configDB is a DB object that contains the sharding metadata of interest.
  // Defaults to the db named "config" on the current connection.
  const configDB = await getConfigDB(db);
  const mongosColl = configDB.getCollection('mongos');
  const versionColl = configDB.getCollection('version');
  const shardsColl = configDB.getCollection('shards');
  const chunksColl = configDB.getCollection('chunks');
  const settingsColl = configDB.getCollection('settings');
  const changelogColl = configDB.getCollection('changelog');

  const [ version, shards, mostRecentMongos ] = await Promise.all([
    versionColl.findOne(),
    shardsColl.find().sort({ _id: 1 }).toArray(),
    mongosColl.find().sort({ ping: -1 }).limit(1).tryNext()
  ]);
  if (version === null) {
    throw new MongoshInvalidInputError(
      'This db does not have sharding enabled. Be sure you are connecting to a mongos from the shell and not to a mongod.',
      ShellApiErrors.NotConnectedToMongos
    );
  }

  result.shardingVersion = version;

  result.shards = shards;

  // (most recently) active mongoses
  const mongosActiveThresholdMs = 60000;
  let mostRecentMongosTime = null;
  let mongosAdjective = 'most recently active';
  if (mostRecentMongos !== null) {
    mostRecentMongosTime = mostRecentMongos.ping;
    // Mongoses older than the threshold are the most recent, but cannot be
    // considered "active" mongoses. (This is more likely to be an old(er)
    // configdb dump, or all the mongoses have been stopped.)
    if (mostRecentMongosTime.getTime() >= Date.now() - mongosActiveThresholdMs) {
      mongosAdjective = 'active';
    }
  }

  mongosAdjective = `${mongosAdjective} mongoses`;
  if (mostRecentMongosTime === null) {
    result[mongosAdjective] = 'none';
  } else {
    const recentMongosQuery = {
      ping: {
        $gt: ((): any => {
          const d = mostRecentMongosTime;
          d.setTime(d.getTime() - mongosActiveThresholdMs);
          return d;
        })()
      }
    };

    if (verbose) {
      result[mongosAdjective] = await mongosColl
        .find(recentMongosQuery)
        .sort({ ping: -1 })
        .toArray();
    } else {
      result[mongosAdjective] = (await (await mongosColl.aggregate([
        { $match: recentMongosQuery },
        { $group: { _id: '$mongoVersion', num: { $sum: 1 } } },
        { $sort: { num: -1 } }
      ])).toArray() as any[]).map((z: { _id: string; num: number }) => {
        return { [z._id]: z.num };
      });
    }
  }

  const balancerRes: Record<string, any> = {};
  await Promise.all([
    (async(): Promise<void> => {
      // Is autosplit currently enabled
      const autosplit = await settingsColl.findOne({ _id: 'autosplit' }) as any;
      result.autosplit = { 'Currently enabled': autosplit === null || autosplit.enabled ? 'yes' : 'no' };
    })(),
    (async(): Promise<void> => {
      // Is the balancer currently enabled
      const balancerEnabled = await settingsColl.findOne({ _id: 'balancer' }) as any;
      balancerRes['Currently enabled'] = balancerEnabled === null || !balancerEnabled.stopped ? 'yes' : 'no';
    })(),
    (async(): Promise<void> => {
      // Is the balancer currently active
      let balancerRunning = 'unknown';
      try {
        const balancerStatus = await configDB.adminCommand({ balancerStatus: 1 });
        balancerRunning = balancerStatus.inBalancerRound ? 'yes' : 'no';
      } catch (err) {
        // pass, ignore all error messages
      }
      balancerRes['Currently running'] = balancerRunning;
    })(),
    (async(): Promise<void> => {
      // Output the balancer window
      const settings = await settingsColl.findOne({ _id: 'balancer' });
      if (settings !== null && settings.hasOwnProperty('activeWindow')) {
        const balSettings = settings.activeWindow;
        balancerRes['Balancer active window is set between'] = `${balSettings.start} and ${balSettings.stop} server local time`;
      }
    })(),
    (async(): Promise<void> => {
      // Output the list of active migrations
      type Lock = { _id: string; when: Date };
      const activeLocks: Lock[] = await configDB.getCollection('locks').find({ state: { $eq: 2 } }).toArray() as Lock[];
      if (activeLocks?.length > 0) {
        balancerRes['Collections with active migrations'] = activeLocks.map((lock) => {
          return `${lock._id} started at ${lock.when}`;
        });
      }
    })(),
    (async(): Promise<void> => {
      // Actionlog and version checking only works on 2.7 and greater
      let versionHasActionlog = false;
      const metaDataVersion = version.currentVersion;
      if (metaDataVersion > 5) {
        versionHasActionlog = true;
      }
      if (metaDataVersion === 5) {
        const verArray = (await db.serverBuildInfo()).versionArray;
        if (verArray[0] === 2 && verArray[1] > 6) {
          versionHasActionlog = true;
        }
      }

      if (versionHasActionlog) {
        // Review config.actionlog for errors
        const balErrs = await configDB.getCollection('actionlog').find({ what: 'balancer.round' }).sort({ time: -1 }).limit(5).toArray();
        const actionReport = { count: 0, lastErr: '', lastTime: ' ' };
        if (balErrs !== null) {
          balErrs.forEach((r: any) => {
            if (r.details.errorOccured) {
              actionReport.count += 1;
              if (actionReport.count === 1) {
                actionReport.lastErr = r.details.errmsg;
                actionReport.lastTime = r.time;
              }
            }
          });
        }
        // Always print the number of failed rounds
        balancerRes['Failed balancer rounds in last 5 attempts'] = actionReport.count;

        // Only print the errors if there are any
        if (actionReport.count > 0) {
          balancerRes['Last reported error'] = actionReport.lastErr;
          balancerRes['Time of Reported error'] = actionReport.lastTime;
        }
        // const migrations = sh.getRecentMigrations(configDB);
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        // Successful migrations.
        let migrations = await (await changelogColl
          .aggregate([
            {
              $match: {
                time: { $gt: yesterday },
                what: 'moveChunk.from',
                'details.errmsg': { $exists: false },
                'details.note': 'success'
              }
            },
            { $group: { _id: { msg: '$details.errmsg' }, count: { $sum: 1 } } },
            { $project: { _id: { $ifNull: ['$_id.msg', 'Success'] }, count: '$count' } }
          ]))
          .toArray();

        // Failed migrations.
        migrations = migrations.concat(
          await (await changelogColl
            .aggregate([
              {
                $match: {
                  time: { $gt: yesterday },
                  what: 'moveChunk.from',
                  $or: [
                    { 'details.errmsg': { $exists: true } },
                    { 'details.note': { $ne: 'success' } }
                  ]
                }
              },
              {
                $group: {
                  _id: { msg: '$details.errmsg', from: '$details.from', to: '$details.to' },
                  count: { $sum: 1 }
                }
              },
              {
                $project: {
                  _id: { $ifNull: ['$_id.msg', 'aborted'] },
                  from: '$_id.from',
                  to: '$_id.to',
                  count: '$count'
                }
              }
            ]))
            .toArray());

        const migrationsRes: Record<number, string> = {};
        migrations.forEach((x: any) => {
          if (x._id === 'Success') {
            migrationsRes[x.count] = x._id;
          } else {
            migrationsRes[x.count] = `Failed with error '${x._id}', from ${x.from} to ${x.to}`;
          }
        });
        if (migrations.length === 0) {
          balancerRes['Migration Results for the last 24 hours'] = 'No recent migrations';
        } else {
          balancerRes['Migration Results for the last 24 hours'] = migrationsRes;
        }
      }
    })()
  ]);
  result.balancer = balancerRes;

  const dbRes: any[] = [];
  result.databases = dbRes;

  const databases = await configDB.getCollection('databases').find().sort({ name: 1 }).toArray();

  // Special case the config db, since it doesn't have a record in config.databases.
  databases.push({ '_id': 'config', 'primary': 'config', 'partitioned': true });
  databases.sort((a: any, b: any): any => {
    return a._id > b._id;
  });

  result.databases = await Promise.all(databases.map(async(db) => {
    const escapeRegex = (string: string): string => {
      return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    };
    const colls = await configDB.getCollection('collections')
      .find({ _id: new RegExp('^' + escapeRegex(db._id) + '\\.') })
      .sort({ _id: 1 })
      .toArray();

    const collList: any =
      await Promise.all(colls.filter(coll => !coll.dropped).map(async(coll) => {
        const collRes = {} as any;
        collRes.shardKey = coll.key;
        collRes.unique = !!coll.unique;
        if (typeof coll.unique !== 'boolean' && typeof coll.unique !== 'undefined') {
          collRes.unique = [ !!coll.unique, { unique: coll.unique } ];
        }
        collRes.balancing = !coll.noBalance;
        if (typeof coll.noBalance !== 'boolean' && typeof coll.noBalance !== 'undefined') {
          collRes.balancing = [ !coll.noBalance, { noBalance: coll.noBalance } ];
        }
        const chunksRes = [];
        const chunks = await
        (await chunksColl.aggregate({ $match: { ns: coll._id } },
          { $group: { _id: '$shard', cnt: { $sum: 1 } } },
          { $project: { _id: 0, shard: '$_id', nChunks: '$cnt' } },
          { $sort: { shard: 1 } })
        ).toArray();
        let totalChunks = 0;
        chunks.forEach((z: any) => {
          totalChunks += z.nChunks;
          collRes.chunkMetadata = { shard: z.shard, nChunks: z.nChunks };
        });

        // NOTE: this will return the chunk info as a string, and will print ugly BSON
        if (totalChunks < 20 || verbose) {
          (await chunksColl.find({ 'ns': coll._id })
            .sort({ min: 1 }).toArray())
            .forEach((chunk: any) => {
              const c = {
                min: chunk.min,
                max: chunk.max,
                'on shard': chunk.shard,
                'last modified': chunk.lastmod
              } as any;
              if (chunk.jumbo) c.jumbo = 'yes';
              chunksRes.push(c);
            });
        } else {
          chunksRes.push('too many chunks to print, use verbose if you want to force print');
        }

        const tagsRes: any[] = [];
        (await configDB.getCollection('tags')
          .find({ ns: coll._id })
          .sort({ min: 1 })
          .toArray())
          .forEach((tag: any) => {
            tagsRes.push({
              tag: tag.tag,
              min: tag.min,
              max: tag.max
            });
          });
        collRes.chunks = chunksRes;
        collRes.tags = tagsRes;
        return [coll._id, collRes];
      }));
    return { database: db, collections: Object.fromEntries(collList) };
  }));
  return result;
}

export async function getConfigDB(db: Database): Promise<Database> {
  const isM = await db._runAdminCommand({ isMaster: 1 });
  if (isM.msg !== 'isdbgrid') {
    throw new MongoshInvalidInputError('Not connected to a mongos', ShellApiErrors.NotConnectedToMongos);
  }
  return db.getSiblingDB('config');
}

export function dataFormat(bytes?: number): string {
  if (bytes === null || bytes === undefined) {
    return '0B';
  }

  if (bytes < 1024) {
    return Math.floor(bytes) + 'B';
  }
  if (bytes < 1024 * 1024) {
    return Math.floor(bytes / 1024) + 'KiB';
  }
  if (bytes < 1024 * 1024 * 1024) {
    return Math.floor((Math.floor(bytes / 1024) / 1024) * 100) / 100 + 'MiB';
  }
  return Math.floor((Math.floor(bytes / (1024 * 1024)) / 1024) * 100) / 100 + 'GiB';
}

export function tsToSeconds(x: any): number {
  if (x.t && x.i) {
    return x.t;
  }
  return x / 4294967296; // low 32 bits are ordinal #s within a second
}

export function addHiddenDataProperty<T = any>(target: T, key: string|symbol, value: any): T {
  Object.defineProperty(target, key, {
    value,
    enumerable: false,
    writable: true,
    configurable: true
  });
  return target;
}

export async function iterate(
  results: CursorIterationResult,
  cursor: FindCursor | SPAggregationCursor | ChangeStream,
  batchSize: number): Promise<CursorIterationResult> {
  if (cursor.closed) {
    return results;
  }

  for (let i = 0; i < batchSize; i++) {
    const doc = await cursor.tryNext();
    if (doc === null) {
      results.cursorHasMore = false;
      break;
    }

    results.documents.push(doc);
  }

  return results;
}

export type FindAndModifyMethodShellOptions = {
  query: Document;
  sort?: FindAndModifyOptions['sort'];
  update?: Document | Document[];
  remove?: boolean;
  new?: boolean;
  fields?: Document;
  upsert?: boolean;
  bypassDocumentValidation?: boolean;
  writeConcern?: Document;
  collation?: FindAndModifyOptions['collation'];
  arrayFilters?: Document[];
  explain?: ExplainVerbosityLike;
};

export type FindAndModifyShellOptions = FindAndModifyOptions & {
  returnNewDocument?: boolean;
};

export function processFindAndModifyOptions(options: FindAndModifyShellOptions): FindAndModifyOptions {
  options = { ...options };
  if ('returnOriginal' in options) {
    delete options.returnNewDocument;
    return options;
  }
  if ('returnNewDocument' in options) {
    options.returnOriginal = !options.returnNewDocument;
    delete options.returnNewDocument;
    return options;
  }
  if ('new' in options) {
    options.returnOriginal = !options.new;
    delete options.new;
    return options;
  }
  // No explicit option passed: We set 'returnOriginal' to true because the
  // default of the shell differs from the default of the browser.
  options.returnOriginal = true;
  return options;
}

export type RemoveShellOptions = DeleteOptions & { justOne?: boolean };
export function processRemoveOptions(options: boolean | RemoveShellOptions): RemoveShellOptions {
  if (typeof options === 'boolean') {
    return { justOne: options };
  }
  return { justOne: false, ...options };
}

export type MapReduceShellOptions = Document | string;
export function processMapReduceOptions(optionsOrOutString: MapReduceShellOptions): MapReduceOptions {
  if (typeof optionsOrOutString === 'string') {
    return { out: optionsOrOutString } as any;
  } else if (optionsOrOutString.out === undefined) {
    throw new MongoshInvalidInputError('Missing \'out\' option', CommonErrors.InvalidArgument);
  } else {
    return optionsOrOutString;
  }
}

export async function setHideIndex(coll: Collection, index: string | Document, hidden: boolean): Promise<Document> {
  const cmd = typeof index === 'string' ? {
    name: index, hidden
  } : {
    keyPattern: index, hidden
  };
  return await coll._mongo._serviceProvider.runCommandWithCheck(
    coll._database._name, {
      collMod: coll._name,
      index: cmd
    },
    coll._database._baseOptions
  );
}

export function assertCLI(platform: ReplPlatform, features: string): void {
  if (
    platform !== ReplPlatform.CLI
  ) {
    throw new MongoshUnimplementedError(
      `${features} are not supported for current platform: ${ReplPlatform[platform]}`,
      CommonErrors.NotImplemented
    );
  }
}

export function processFLEOptions(fleOptions: ClientSideFieldLevelEncryptionOptions): AutoEncryptionOptions {
  assertKeysDefined(fleOptions, ['keyVaultNamespace', 'kmsProviders']);
  Object.keys(fleOptions).forEach(k => {
    if (['keyVaultClient', 'keyVaultNamespace', 'kmsProviders', 'schemaMap', 'bypassAutoEncryption'].indexOf(k) === -1) {
      throw new MongoshInvalidInputError(`Unrecognized FLE Client Option ${k}`);
    }
  });
  const autoEncryption: AutoEncryptionOptions = {
    keyVaultClient: fleOptions.keyVaultClient?._serviceProvider.getRawClient(),
    keyVaultNamespace: fleOptions.keyVaultNamespace
  };

  const localKey = fleOptions.kmsProviders.local?.key;
  if (localKey && (localKey as BinaryType)._bsontype === 'Binary') {
    const rawBuff = (localKey as BinaryType).value(true);
    if (Buffer.isBuffer(rawBuff)) {
      autoEncryption.kmsProviders = {
        ...fleOptions.kmsProviders,
        local: {
          key: rawBuff
        }
      };
    } else {
      throw new MongoshInvalidInputError('When specifying the key of a local KMS as BSON binary it must be constructed from a base64 encoded string');
    }
  } else {
    autoEncryption.kmsProviders = { ...fleOptions.kmsProviders } as KMSProviders;
  }

  if (fleOptions.schemaMap) {
    autoEncryption.schemaMap = fleOptions.schemaMap;
  }
  if (fleOptions.bypassAutoEncryption !== undefined) {
    autoEncryption.bypassAutoEncryption = fleOptions.bypassAutoEncryption;
  }
  return autoEncryption;
}

// The then?: never check is to make sure this doesn't accidentally get applied
// to an un-awaited Promise, which is something that the author of this function
// might have messed up while implementing this.
type NotAPromise = { [key: string]: any, then?: never };
export function maybeMarkAsExplainOutput<T extends NotAPromise>(value: T, options: ExplainOptions): T {
  if ('explain' in options) {
    return markAsExplainOutput(value);
  }
  return value;
}

export function markAsExplainOutput<T extends NotAPromise>(value: T): T {
  if (value !== null && typeof value === 'object') {
    addHiddenDataProperty(value as any, shellApiType, 'ExplainOutput');
  }
  return value;
}
