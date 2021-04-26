import {
  classPlatforms,
  hasAsyncChild,
  returnsPromise,
  returnType,
  ShellApiClass,
  shellApiClassDefault
} from './decorators';
import {
  ClientEncryption as MongoCryptClientEncryption,
  ClientEncryptionCreateDataKeyProviderOptions,
  ClientEncryptionDataKeyProvider,
  ClientEncryptionOptions,
  ClientEncryptionEncryptOptions,
  KMSProviders,
  ReplPlatform,
  AWSEncryptionKeyOptions,
  AzureEncryptionKeyOptions,
  GCPEncryptionKeyOptions
} from '@mongosh/service-provider-core';
import type { Document, BinaryType } from '@mongosh/service-provider-core';
import Collection from './collection';
import Cursor from './cursor';
import { DeleteResult } from './result';
import { assertArgsDefinedType } from './helpers';
import { asPrintable } from './enums';
import { redactCredentials } from '@mongosh/history';
import type Mongo from './mongo';
import { CommonErrors, MongoshInvalidInputError, MongoshRuntimeError } from '@mongosh/errors';

export type ClientSideFieldLevelEncryptionKmsProvider = Omit<KMSProviders, 'local'> & {
  local?: {
    key: Buffer | string | BinaryType;
  }
};

export interface ClientSideFieldLevelEncryptionOptions {
  keyVaultClient?: Mongo,
  keyVaultNamespace: string,
  kmsProviders: ClientSideFieldLevelEncryptionKmsProvider,
  schemaMap?: Document,
  bypassAutoEncryption?: boolean;
  explicitEncryptionOnly?: boolean;
}

@shellApiClassDefault
@hasAsyncChild
@classPlatforms([ ReplPlatform.CLI ] )
export class ClientEncryption extends ShellApiClass {
  public _mongo: Mongo;
  public _libmongocrypt: MongoCryptClientEncryption;

  constructor(mongo: Mongo) {
    super();
    this._mongo = mongo;

    const fle = mongo._serviceProvider.fle;
    if (!fle) {
      throw new MongoshRuntimeError('FLE API is not available');
    }

    this._libmongocrypt = new fle.ClientEncryption(
      mongo._serviceProvider.getRawClient(),
      {
        ...(this._mongo._fleOptions as ClientEncryptionOptions)
      }
    );
  }

  [asPrintable](): string {
    return `ClientEncryption class for ${redactCredentials(this._mongo._uri)}`;
  }

  @returnsPromise
  async encrypt(
    encryptionId: BinaryType,
    value: any,
    encryptionAlgorithm: ClientEncryptionEncryptOptions['algorithm']
  ): Promise<BinaryType> {
    assertArgsDefinedType([encryptionId, value, encryptionAlgorithm], [true, true, true], 'ClientEncryption.encrypt');
    return await this._libmongocrypt.encrypt(
      value,
      {
        keyId: encryptionId,
        algorithm: encryptionAlgorithm
      }
    );
  }

  @returnsPromise
  async decrypt(
    encryptedValue: BinaryType
  ): Promise<any> {
    assertArgsDefinedType([encryptedValue], [true], 'ClientEncryption.decrypt');
    return await this._libmongocrypt.decrypt(encryptedValue);
  }
}

@shellApiClassDefault
@hasAsyncChild
@classPlatforms([ ReplPlatform.CLI ] )
export class KeyVault extends ShellApiClass {
  public _mongo: Mongo;
  public _clientEncryption: ClientEncryption;
  private _keyColl: Collection;
  constructor(clientEncryption: ClientEncryption) {
    super();
    this._mongo = clientEncryption._mongo;
    this._clientEncryption = clientEncryption;
    if (!this._mongo._fleOptions || !this._mongo._fleOptions.keyVaultNamespace) {
      throw new MongoshInvalidInputError('FLE options must be passed to the Mongo object');
    }
    const [ db, coll ] = this._mongo._fleOptions.keyVaultNamespace.split('.');
    this._keyColl = this._mongo.getDB(db).getCollection(coll);
  }

  [asPrintable](): string {
    return `KeyVault class for ${redactCredentials(this._mongo._uri)}`;
  }

  createKey(kms: 'local', keyAltNames?: string[]): Promise<Document>
  createKey(kms: ClientEncryptionDataKeyProvider, legacyMasterKey: string, keyAltNames?: string[]): Promise<Document>
  createKey(kms: ClientEncryptionDataKeyProvider, options: AWSEncryptionKeyOptions | AzureEncryptionKeyOptions | GCPEncryptionKeyOptions | undefined): Promise<Document>
  createKey(kms: ClientEncryptionDataKeyProvider, options: AWSEncryptionKeyOptions | AzureEncryptionKeyOptions | GCPEncryptionKeyOptions | undefined, keyAltNames: string[]): Promise<Document>
  @returnsPromise
  // eslint-disable-next-line complexity
  async createKey(
    kms: ClientEncryptionDataKeyProvider,
    masterKeyOrAltNames?: AWSEncryptionKeyOptions | AzureEncryptionKeyOptions | GCPEncryptionKeyOptions | string | undefined | string[],
    keyAltNames?: string[]
  ): Promise<Document> {
    assertArgsDefinedType([kms], [true], 'KeyVault.createKey');

    if (typeof masterKeyOrAltNames === 'string') {
      if (kms === 'local' && masterKeyOrAltNames === '') {
        // allowed in the old shell - even enforced prior to 4.2.3
        // https://docs.mongodb.com/manual/reference/method/KeyVault.createKey/
        masterKeyOrAltNames = undefined;
      } else {
        throw new MongoshInvalidInputError(
          'KeyVault.createKey does not support providing masterKey as string anymore. For AWS please use createKey("aws", { region: ..., masterKey: ... })',
          CommonErrors.Deprecated
        );
      }
    } else if (Array.isArray(masterKeyOrAltNames)) {
      // old signature - one could immediately provide an array of key alt names
      // not documented but visible in code: https://github.com/mongodb/mongo/blob/eb2b72cf9c0269f086223d499ac9be8a270d268c/src/mongo/shell/keyvault.js#L19
      if (kms !== 'local') {
        throw new MongoshInvalidInputError(
          'KeyVault.createKey requires masterKey to be given as second argument if KMS is not local',
          CommonErrors.InvalidArgument
        );
      } else {
        if (keyAltNames) {
          throw new MongoshInvalidInputError(
            'KeyVault.createKey was supplied with an array for the masterKey and keyAltNames - either specify keyAltNames as second argument or set undefined for masterKey',
            CommonErrors.InvalidArgument
          );
        }

        keyAltNames = masterKeyOrAltNames;
        masterKeyOrAltNames = undefined;
      }
    }

    let options: ClientEncryptionCreateDataKeyProviderOptions | undefined;
    if (masterKeyOrAltNames) {
      options = {
        masterKey: masterKeyOrAltNames as ClientEncryptionCreateDataKeyProviderOptions['masterKey']
      };
    }
    if (keyAltNames) {
      options = {
        ...(options ?? {}),
        keyAltNames
      };
    }

    const keyId = await this._clientEncryption._libmongocrypt.createDataKey(kms, options as ClientEncryptionCreateDataKeyProviderOptions);
    // This can/should be removed once https://jira.mongodb.org/browse/NODE-3118 is fixed
    if (options?.keyAltNames?.length && !(await this.getKey(keyId).next())?.keyAltNames?.length) {
      for (const altname of options.keyAltNames) {
        await this.addKeyAlternateName(keyId, altname);
      }
    }
    return keyId;
  }

  @returnType('Cursor')
  getKey(keyId: BinaryType): Cursor {
    assertArgsDefinedType([keyId], [true], 'KeyVault.getKey');
    return this._keyColl.find({ '_id': keyId });
  }

  @returnType('Cursor')
  getKeyByAltName(keyAltName: string): Cursor {
    assertArgsDefinedType([keyAltName], ['string'], 'KeyVault.getKeyByAltName');
    return this._keyColl.find({ 'keyAltNames': keyAltName });
  }

  @returnType('Cursor')
  getKeys(): Cursor {
    return this._keyColl.find({});
  }

  @returnsPromise
  async deleteKey(keyId: BinaryType): Promise<DeleteResult | Document> {
    assertArgsDefinedType([keyId], [true], 'KeyVault.deleteKey');
    return this._keyColl.deleteOne({ '_id': keyId });
  }

  @returnsPromise
  async addKeyAlternateName(keyId: BinaryType, keyAltName: string): Promise<Document> {
    assertArgsDefinedType([keyId, keyAltName], [true, 'string'], 'KeyVault.addKeyAlternateName');
    return this._keyColl.findAndModify({
      query: { '_id': keyId },
      update: { $push: { 'keyAltNames': keyAltName }, $currentDate: { 'updateDate': true } },
    });
  }

  @returnsPromise
  async removeKeyAlternateName(keyId: BinaryType, keyAltName: string): Promise<Document> {
    assertArgsDefinedType([keyId, keyAltName], [true, 'string'], 'KeyVault.removeKeyAlternateName');
    const ret = await this._keyColl.findAndModify({
      query: { '_id': keyId },
      update: { $pull: { 'keyAltNames': keyAltName }, $currentDate: { 'updateDate': true } }
    });

    if (ret !== null && ret.keyAltNames !== undefined && ret.keyAltNames.length === 1 && ret.keyAltNames[0] === keyAltName) {
      // Remove the empty array to prevent duplicate key violations
      return this._keyColl.findAndModify({
        query: { '_id': keyId, 'keyAltNames': undefined },
        update: { $unset: { 'keyAltNames': '' }, $currentDate: { 'updateDate': true } }
      });
    }
    return ret;
  }
}
