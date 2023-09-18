import type {
  ClientEncryptionEncryptOptions,
  MongoClient,
  Document,
  AutoEncryptionOptions,
} from 'mongodb';
import type { DataService } from './data-service';
import type {
  CollectionInfo,
  CollectionInfoNameOnly,
  ListCollectionsOptions,
} from './run-command';
import parseNamespace from 'mongodb-ns';
import _ from 'lodash';
import type { UnboundDataServiceImplLogger } from './logger';
import { mongoLogId } from './logger';

/**
 * A list of field paths for a document.
 * For example, ['a', 'b'] refers to the field b of the nested document a.
 * This is used rather than dot-style `a.b` notation to disambiguate
 * cases in which field names contain a literal `.` character.
 */
type FieldPath = string[];

/**
 * A description of the list of encrypted fields for a given collection.
 * Equality-searchable fields are handled separately since they require
 * special treatments in some cases.
 */
export interface CSFLEEncryptedFieldsSet {
  readonly encryptedFields: FieldPath[];
  readonly equalityQueryableEncryptedFields: FieldPath[];
}

/**
 * Helper for ensuring that all fields that were decrypted when
 * they were read from the server are also written back as encrypted.
 */
export interface CSFLECollectionTracker {
  /**
   * Returns whether performing an update (or replacement) of
   * `originalDocument` from the collection `ns` is allowable
   * with regards to re-encrypting fields that were originally
   * decrypted.
   *
   * The original documents **must** have been received from the
   * server or generated from a HadronDocument instance that
   * was created based on a document received from the server.
   * This is required for ensuring that the tracker properly
   * recognizes fields that were read as decrypted fields.
   *
   * @param ns A MongoDB `database.collection` namespace.
   * @param originalDocument The original document that was received from the server.
   */
  isUpdateAllowed(ns: string, originalDocument: Document): Promise<boolean>;

  /**
   * Returns whether a collection is known to have a schema
   * description that would prevent unintentional inserts
   * of unencrypted data.
   *
   * This includes the case in which any server schema is
   * present, not just one that indicates that there are fields
   * which should be encrypted.
   *
   * @param ns A MongoDB `database.collection` namespace.
   */
  knownSchemaForCollection(
    ns: string
  ): Promise<{ hasSchema: boolean; encryptedFields: CSFLEEncryptedFieldsSet }>;

  updateCollectionInfo(
    namespace: string,
    result: CollectionInfoNameOnly & Partial<CollectionInfo>
  ): void;
}

class CSFLEEncryptedFieldsSetImpl implements CSFLEEncryptedFieldsSet {
  _encryptedFields: { path: FieldPath; equalityQueryable: boolean }[] = [];

  get encryptedFields(): FieldPath[] {
    return this._encryptedFields.map(({ path }) => path);
  }

  get equalityQueryableEncryptedFields(): FieldPath[] {
    return this._encryptedFields
      .filter(({ equalityQueryable }) => equalityQueryable)
      .map(({ path }) => path);
  }

  addField(path: Readonly<FieldPath>, equalityQueryable: boolean): this {
    const existingField = this._encryptedFields.find((field) =>
      _.isEqual(field.path, path)
    );
    if (existingField) {
      // Deduplicate field entries. If there already is one for this field,
      // only make sure that the `equalityQueryable` attributes match.
      // If they don't, assume that the field is not equality-queryable.
      existingField.equalityQueryable &&= equalityQueryable;
    } else {
      this._encryptedFields.push({ path: [...path], equalityQueryable });
    }
    return this;
  }

  withPathPrefix(prefix: string): CSFLEEncryptedFieldsSetImpl {
    const ret = new CSFLEEncryptedFieldsSetImpl();
    ret._encryptedFields = this._encryptedFields.map(
      ({ path, equalityQueryable }) => ({
        path: [prefix, ...path],
        equalityQueryable,
      })
    );
    return ret;
  }

  static isEncryptedField(
    set: CSFLEEncryptedFieldsSet,
    path: FieldPath
  ): boolean {
    return set.encryptedFields.some((encryptedField) =>
      _.isEqual(path, encryptedField)
    );
  }

  static isEqualityQueryableEncryptedField(
    set: CSFLEEncryptedFieldsSet,
    path: FieldPath
  ): boolean {
    return set.equalityQueryableEncryptedFields.some((encryptedField) =>
      _.isEqual(path, encryptedField)
    );
  }

  static merge(
    ...sets: (CSFLEEncryptedFieldsSet | undefined)[]
  ): CSFLEEncryptedFieldsSetImpl {
    const ret = new CSFLEEncryptedFieldsSetImpl();
    for (const set of sets) {
      if (!set) continue;
      for (const field of set.encryptedFields) {
        ret.addField(field, this.isEqualityQueryableEncryptedField(set, field));
      }
    }
    return ret;
  }
}

interface CSFLECollectionInfo {
  serverEnforcedEncryptedFields?: CSFLEEncryptedFieldsSetImpl;
  clientEnforcedEncryptedFields?: CSFLEEncryptedFieldsSetImpl;
  hasServerSchema?: boolean;
  lastUpdated?: Date;
}

// Fetch a list of encrypted fields from a JSON schema document.
function extractEncryptedFieldsFromSchema(
  schema: Document | undefined
): CSFLEEncryptedFieldsSetImpl {
  let ret = new CSFLEEncryptedFieldsSetImpl();
  if (schema?.encrypt) {
    const algorithm: ClientEncryptionEncryptOptions['algorithm'] =
      schema?.encrypt?.algorithm;
    // Deterministic encryption in CSFLE = Equality-searchable
    return ret.addField(
      [],
      algorithm === 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic'
    );
  }
  for (const [key, subschema] of Object.entries(schema?.properties ?? {})) {
    const subfields = extractEncryptedFieldsFromSchema(subschema as Document);
    ret = CSFLEEncryptedFieldsSetImpl.merge(ret, subfields.withPathPrefix(key));
  }
  return ret;
}

// Fetch a list of encrypted fields from a QE EncryptedFieldConfig document.
function extractEncryptedFieldsFromEncryptedFieldsConfig(
  encryptedFields: Document | undefined
): CSFLEEncryptedFieldsSetImpl {
  const fields: any[] = encryptedFields?.fields ?? [];
  const ret = new CSFLEEncryptedFieldsSetImpl();
  for (const field of fields) {
    const queries: any[] = Array.isArray(field.queries)
      ? field.queries
      : [field.queries ?? {}];
    const equalityQueryable = queries.some(({ queryType }) =>
      ['equality', 'range', 'rangePreview'].includes(queryType)
    );
    ret.addField(field.path.split('.'), equalityQueryable);
  }
  return ret;
}

// Fetch a list of encrypted fields based on client-side driver options.
function extractEncrytedFieldFromAutoEncryptionOptions(
  ns: string,
  autoEncryption: AutoEncryptionOptions
): CSFLEEncryptedFieldsSetImpl {
  return CSFLEEncryptedFieldsSetImpl.merge(
    extractEncryptedFieldsFromSchema(autoEncryption.schemaMap?.[ns]),
    extractEncryptedFieldsFromEncryptedFieldsConfig(
      autoEncryption?.encryptedFieldsMap?.[ns]
    )
  );
}

// Fetch a list of encrypted fields based on the server-side collection info.
function extractEncryptedFieldsFromListCollectionsResult(
  options: CollectionInfo['options'] | undefined
): CSFLEEncryptedFieldsSetImpl {
  const schema = options?.validator?.$jsonSchema;
  const encryptedFieldsConfig = options?.encryptedFields;
  return CSFLEEncryptedFieldsSetImpl.merge(
    extractEncryptedFieldsFromSchema(schema),
    extractEncryptedFieldsFromEncryptedFieldsConfig(encryptedFieldsConfig)
  );
}

// Fetch a list of encrypted fields based on a document received from the server.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractEncryptedFieldsFromDocument(doc: any): FieldPath[] {
  const decryptedFields = (doc?.[Symbol.for('@@mdb.decryptedKeys')] ?? []).map(
    (field: string) => [field]
  );
  for (const [key, value] of Object.entries(doc)) {
    if (!value || typeof value !== 'object') {
      continue;
    }
    const nestedFields = extractEncryptedFieldsFromDocument(value);
    decryptedFields.push(...nestedFields.map((path) => [key, ...path]));
  }
  return decryptedFields;
}

function isOlderThan1Minute(oldDate: Date): boolean {
  return Date.now() - oldDate.getTime() >= 60_000;
}

export class CSFLECollectionTrackerImpl implements CSFLECollectionTracker {
  _nsToInfo = new Map<string, CSFLECollectionInfo>();

  constructor(
    private _dataService: Pick<DataService, 'on' | 'listCollections'>,
    private _crudClient: MongoClient,
    private _logger?: UnboundDataServiceImplLogger
  ) {
    this._processClientSchemaDefinitions();

    const { autoEncrypter } = this._crudClient as any;
    if (autoEncrypter) {
      this._logger?.info(
        'COMPASS-DATA-SERVICE',
        mongoLogId(1_001_000_118),
        'CSFLECollectionTracker',
        'Hooking AutoEncrypter metaDataClient property'
      );
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      autoEncrypter._metaDataClient = this._createHookedMetadataClient(
        autoEncrypter._metaDataClient as MongoClient
      );
    }
  }

  async isUpdateAllowed(
    ns: string,
    originalDocument: Document
  ): Promise<boolean> {
    const originalDocEncryptedFields =
      extractEncryptedFieldsFromDocument(originalDocument);
    if (originalDocEncryptedFields.length === 0) {
      // Shortcut: If no fields were encrypted when we got them
      // from the server, then we also do not need to worry
      // about writing them back unencrypted.
      return true;
    }
    const { encryptedFields } = await this.knownSchemaForCollection(ns);
    // Updates are allowed if there is a guarantee that all fields that
    // were decrypted in the original document will also be written back
    // as encrypted fields. To that end, the server or client configuration
    // must contain entries that are picked up by libmongocrypt as indicators
    // for encrypted fields.
    for (const originalDocPath of originalDocEncryptedFields) {
      if (
        !CSFLEEncryptedFieldsSetImpl.isEncryptedField(
          encryptedFields,
          originalDocPath
        )
      ) {
        return false;
      }
    }
    return true;
  }

  async knownSchemaForCollection(ns: string): Promise<{
    hasSchema: boolean;
    encryptedFields: CSFLEEncryptedFieldsSetImpl;
  }> {
    const info = await this._fetchCSFLECollectionInfo(ns);
    const encryptedFields = CSFLEEncryptedFieldsSetImpl.merge(
      info.clientEnforcedEncryptedFields,
      info.serverEnforcedEncryptedFields
    );
    const hasSchema = !!(
      info.hasServerSchema || encryptedFields.encryptedFields.length > 0
    );
    return { hasSchema, encryptedFields };
  }

  _processClientSchemaDefinitions(): void {
    // Process client-side options available at instantiation time.
    const { autoEncryption } = this._crudClient.options;
    for (const ns of [
      ...Object.keys(autoEncryption?.schemaMap ?? {}),
      ...Object.keys(autoEncryption?.encryptedFieldsMap ?? {}),
    ]) {
      this._logger?.info(
        'COMPASS-DATA-SERVICE',
        mongoLogId(1_001_000_119),
        'CSFLECollectionTracker',
        'Processing client-side schema information',
        { ns }
      );
      const info = this._getCSFLECollectionInfo(ns);
      info.clientEnforcedEncryptedFields =
        extractEncrytedFieldFromAutoEncryptionOptions(ns, autoEncryption);
    }
  }

  async _fetchCSFLECollectionInfo(ns: string): Promise<CSFLECollectionInfo> {
    const parsedNs = parseNamespace(ns);
    const info = this._getCSFLECollectionInfo(ns);
    if (
      !info.serverEnforcedEncryptedFields ||
      !info.lastUpdated ||
      isOlderThan1Minute(info.lastUpdated)
    ) {
      this._logger?.info(
        'COMPASS-DATA-SERVICE',
        mongoLogId(1_001_000_120),
        'CSFLECollectionTracker',
        'Refreshing listCollections cache',
        { ns }
      );
      // Let the data service fetch new collection infos.
      // We installed a listener earlier which picks up the results,
      // and additionally also fetches the results from unrelated
      // listCollections calls so that explicitly fetching them
      // becomes necessary less often.
      await this._dataService.listCollections(parsedNs.database, {
        name: parsedNs.collection,
      });
    }
    return info;
  }

  _getCSFLECollectionInfo(ns: string): CSFLECollectionInfo {
    // Look up the internally stored CSFLE collection info for a specific namespace.
    const existing = this._nsToInfo.get(ns);
    if (existing) return existing;
    const info: CSFLECollectionInfo = {};
    this._nsToInfo.set(ns, info);
    return info;
  }

  updateCollectionInfo(
    ns: string,
    result: CollectionInfoNameOnly & Partial<CollectionInfo>
  ): void {
    this._logger?.info(
      'COMPASS-DATA-SERVICE',
      mongoLogId(1_001_000_121),
      'CSFLECollectionTracker',
      'Processing listCollections update',
      { ns }
    );

    const info = this._getCSFLECollectionInfo(ns);
    // Store the updated list of encrypted fields.
    // This list can be empty if no server-side validation existed or was removed.
    info.serverEnforcedEncryptedFields =
      extractEncryptedFieldsFromListCollectionsResult(result.options);
    info.hasServerSchema = !!result.options?.validator?.$jsonSchema;
    info.lastUpdated = new Date();
  }

  _createHookedMetadataClient(wrappedClient: MongoClient): MongoClient {
    // The AutoEncrypter instance used by the MongoClient will
    // use listCollections to look up metadata for a given collection.
    // We hook into this process to verify that this listCollections
    // call does not return looser restrictions than those that
    // Compass knows about and relies on.

    // This listCollections call will only be made in a specific way,
    // with specific arguments. If this ever changes at some point,
    // we may need to work out e.g. a good semi-official hook with the
    // driver team, similar to what we have for the @@mdb.decryptedFields
    // functionality, but currently no such changes are planned or expected.
    return {
      db: (dbName: string) => {
        return {
          listCollections: (filter: Document, opts: ListCollectionsOptions) => {
            return {
              toArray: async () => {
                const collectionInfos = await wrappedClient
                  .db(dbName)
                  .listCollections(filter, opts)
                  .toArray();
                const err = this._checkListCollectionsForLibmongocryptResult(
                  dbName,
                  filter,
                  (collectionInfos ?? []) as CollectionInfo[]
                );
                if (err) {
                  this._logger?.error(
                    'COMPASS-DATA-SERVICE',
                    mongoLogId(1_001_000_122),
                    'CSFLECollectionTracker',
                    'Rejecting listCollections in hooked metaDataClient',
                    { error: err.message }
                  );
                  throw err;
                }
                return collectionInfos;
              },
            };
          },
        };
      },
    } as MongoClient;
  }

  _checkListCollectionsForLibmongocryptResult(
    dbName: string,
    filter: Document,
    collectionInfos: CollectionInfo[]
  ): Error | undefined {
    if (typeof filter?.name !== 'string' || collectionInfos.length > 1) {
      // This is an assertion more than an actual error condition.
      // It ensures that we're only getting listCollections requests
      // in the format that we expect them to come in.
      return new Error(
        `[Compass] Unexpected listCollections request on '${dbName}' with name: '${
          filter?.name as string
        }'`
      );
    }

    const ns = `${dbName}.${filter.name}`;
    const existingInfo = this._getCSFLECollectionInfo(ns);

    if (collectionInfos.length === 0) {
      if (existingInfo.serverEnforcedEncryptedFields?.encryptedFields?.length) {
        return new Error(
          `[Compass] Missing encrypted field information of collection '${ns}'`
        );
      }
      return;
    }

    const [info] = collectionInfos;
    if (filter.name !== info.name) {
      // Also just a consistency check to make sure that things
      // didn't go *terribly* wrong somewhere.
      return new Error(
        `[Compass] Unexpected listCollections name mismatch: got ${info.name}, expected ${filter.name}`
      );
    }
    const newInfo = extractEncryptedFieldsFromListCollectionsResult(
      info.options
    );

    for (const expectedEncryptedField of existingInfo
      .serverEnforcedEncryptedFields?.encryptedFields ?? []) {
      if (
        !newInfo.encryptedFields.some((field) =>
          _.isEqual(field, expectedEncryptedField)
        )
      ) {
        return new Error(
          `[Compass] Missing encrypted field '${expectedEncryptedField.join(
            '.'
          )}' of collection '${ns}' in listCollections result`
        );
      }
    }
  }
}
