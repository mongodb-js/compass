import { promises as fs } from 'fs';
import crypto from 'crypto';
import util from 'util';

const scrypt: (password: Buffer, salt: Buffer, len: number) => Promise<Buffer> =
  util.promisify(crypto.scrypt);

const randomBytes = util.promisify(crypto.randomBytes);

import { ConnectionInfo } from './connection-info';

import { validate as uuidValidate } from 'uuid';
import {
  AmpersandMethodOptions,
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
} from './legacy/legacy-connection-model';

type ImportExportOptions = {
  encryptionPassword?: string;
};

type ClearExportedFileContent = {
  version: number;
  encrypted: false;
  connections: ConnectionInfo[];
};

type EncryptedExportedFileContent = {
  version: number;
  encrypted: true;
  connections: { text: string; salt: string };
};

type ExportedFileContent =
  | ClearExportedFileContent
  | EncryptedExportedFileContent;

const IMPORT_EXPORT_SCHEMA_VERSION = 1;
const IMPORT_EXPORT_CIPHER_ALGORITHM = 'aes-256-ecb';

export class ConnectionStorage {
  /**
   * Loads all the ConnectionInfo currently stored.
   *
   * @returns Promise<ConnectionInfo[]>
   */
  async loadAll(): Promise<ConnectionInfo[]> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ConnectionCollection } = require('mongodb-connection-model');
    const connectionCollection = new ConnectionCollection();
    const fetchConnectionModels = promisifyAmpersandMethod(
      connectionCollection.fetch.bind(connectionCollection)
    );

    await fetchConnectionModels();
    return connectionCollection.map(convertConnectionModelToInfo);
  }

  /**
   * Inserts or replaces a ConnectionInfo object in the storage.
   *
   * The ConnectionInfo object must have an id set to a string
   * matching the uuid format.
   *
   * @param connectionInfo - The ConnectionInfo object to be saved.
   */
  async save(connectionInfo: ConnectionInfo): Promise<void> {
    if (!connectionInfo.id) {
      throw new Error('id is required');
    }

    if (!uuidValidate(connectionInfo.id)) {
      throw new Error('id must be a uuid');
    }

    const model = await convertConnectionInfoToModel(connectionInfo);
    model.save();
  }

  /**
   * Deletes a ConnectionInfo object from the storage.
   *
   * If the ConnectionInfo does not have an id, the operation will
   * ignore and return.
   *
   * Trying to remove a ConnectionInfo that is not stored has no effect
   * and won't throw an exception.
   *
   * @param connectionOptions - The ConnectionInfo object to be deleted.
   */
  async delete(connectionOptions: ConnectionInfo): Promise<void> {
    if (!connectionOptions.id) {
      // don't throw attempting to delete a connection
      // that was never saved.
      return;
    }

    const model = await convertConnectionInfoToModel(connectionOptions);
    model.destroy();
  }

  private async _passwordToCypherKey(
    password: string,
    salt: Buffer
  ): Promise<Buffer> {
    const key: Buffer = await scrypt(
      Buffer.from(password),
      salt,
      32 /* bytes = 256 bit */
    );

    return key;
  }

  private async _encrypt(
    text: string,
    password: string
  ): Promise<{ salt: string; text: string }> {
    const salt = await randomBytes(32);
    const key = await this._passwordToCypherKey(password, salt);

    const cipher = crypto.createCipheriv(
      IMPORT_EXPORT_CIPHER_ALGORITHM,
      key,
      // empty iv,
      // the password salt already makes 2 exports of the same connections
      // with the same password to have a different key and different
      // encrypted text
      Buffer.from('')
    );
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(text)),
      cipher.final(),
    ]);

    return {
      text: encrypted.toString('base64'),
      salt: salt.toString('base64'),
    };
  }

  private async _decrypt(text: string, salt: string, password: string) {
    try {
      const key = await this._passwordToCypherKey(
        password,
        Buffer.from(salt, 'base64')
      );

      const decipher = crypto.createDecipheriv(
        IMPORT_EXPORT_CIPHER_ALGORITHM,
        key,
        Buffer.from('')
      );

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(text, 'base64')),
        decipher.final(),
      ]);

      return decrypted.toString();
    } catch (err) {
      throw new Error('Error decrypting connection data.');
    }
  }

  async export(
    connections: ConnectionInfo[],
    targetFile: string,
    options?: ImportExportOptions
  ): Promise<void> {
    const encrypted = !!options?.encryptionPassword;

    const rawContent: ExportedFileContent = encrypted
      ? {
          version: IMPORT_EXPORT_SCHEMA_VERSION,
          encrypted: true,
          connections: await this._encrypt(
            JSON.stringify(connections),
            options?.encryptionPassword ?? ''
          ),
        }
      : {
          version: IMPORT_EXPORT_SCHEMA_VERSION,
          encrypted: false,
          connections,
        };

    await fs.writeFile(targetFile, JSON.stringify(rawContent));
  }

  private _deserializeImportedConnections(
    connections: ConnectionInfo[]
  ): ConnectionInfo[] {
    if (!Array.isArray(connections)) {
      return [];
    }

    return connections.map((connectionInfo) => {
      if (connectionInfo.lastUsed) {
        return {
          ...connectionInfo,
          lastUsed: new Date(connectionInfo.lastUsed),
        };
      }

      return connectionInfo;
    });
  }

  async import(
    sourceFile: string,
    options?: ImportExportOptions
  ): Promise<ConnectionInfo[]> {
    const rawContents: ExportedFileContent = JSON.parse(
      await fs.readFile(sourceFile, 'utf-8')
    );

    if (IMPORT_EXPORT_SCHEMA_VERSION !== 1) {
      throw new Error('Unsupported file format version');
    }

    if (!rawContents.encrypted) {
      return this._deserializeImportedConnections(rawContents.connections);
    }

    if (!options?.encryptionPassword) {
      throw new Error(
        'A password is required to read connections from an encrypted file.'
      );
    }

    const decrypted = await this._decrypt(
      rawContents.connections.text,
      rawContents.connections.salt,
      options.encryptionPassword
    );

    const parsed = JSON.parse(decrypted);

    return this._deserializeImportedConnections(parsed);
  }
}

function promisifyAmpersandMethod<T>(
  fn: (options: AmpersandMethodOptions<T>) => void
): () => Promise<T> {
  return () =>
    new Promise((resolve, reject) => {
      fn({
        success: (model: T) => {
          resolve(model);
        },
        error: (model: T, error: Error) => {
          reject(error);
        },
      });
    });
}
