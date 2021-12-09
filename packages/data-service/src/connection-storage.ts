import { promises as fs } from 'fs';
import crypto from 'crypto';

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

const IMPORT_EXPORT_CIPHER_ALGORITHM = 'aes-256-ecb';
const IMPORT_EXPORT_PASSWORD_HASH_ALGORITHM = 'sha256';
const IMPORT_EXPORT_ENCRYPTED_ENCODING = 'base64';
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

  private _passwordToCypherKey(password: string): Buffer {
    return crypto
      .createHash(IMPORT_EXPORT_PASSWORD_HASH_ALGORITHM)
      .update(password)
      .digest();
  }

  private _encrypt(text: string, password: string) {
    const key = this._passwordToCypherKey(password);

    const cipher = crypto.createCipheriv(
      IMPORT_EXPORT_CIPHER_ALGORITHM,
      key,
      Buffer.from('')
    );
    const encrypted = Buffer.concat([
      cipher.update(Buffer.from(text)),
      cipher.final(),
    ]);

    return encrypted.toString(IMPORT_EXPORT_ENCRYPTED_ENCODING);
  }

  private _decrypt(text: string, password: string) {
    try {
      const key = this._passwordToCypherKey(password);

      const decipher = crypto.createDecipheriv(
        IMPORT_EXPORT_CIPHER_ALGORITHM,
        key,
        Buffer.from('')
      );

      const decrypted = Buffer.concat([
        decipher.update(Buffer.from(text, IMPORT_EXPORT_ENCRYPTED_ENCODING)),
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

    await fs.writeFile(
      targetFile,
      JSON.stringify({
        version: 1,
        encrypted: encrypted,
        connections: encrypted
          ? this._encrypt(
              JSON.stringify(connections),
              options?.encryptionPassword ?? ''
            )
          : connections,
      })
    );
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
    const rawContents = JSON.parse(await fs.readFile(sourceFile, 'utf-8'));
    if (!options?.encryptionPassword) {
      if (
        rawContents.encrypted ||
        typeof rawContents.connections === 'string'
      ) {
        throw new Error(
          'A password is required to read connections from an encrypted file.'
        );
      }

      return this._deserializeImportedConnections(
        rawContents.connections as ConnectionInfo[]
      );
    }

    const decrypted = this._decrypt(
      rawContents.connections,
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
