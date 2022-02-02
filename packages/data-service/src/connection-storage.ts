import type { ConnectionInfo } from './connection-info';

import { validate as uuidValidate } from 'uuid';
import type { AmpersandMethodOptions } from './legacy/legacy-connection-model';
import {
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
} from './legacy/legacy-connection-model';

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
}

export function promisifyAmpersandMethod<T>(
  fn: (options: AmpersandMethodOptions<T>) => void
): () => Promise<T> {
  return (...args) =>
    new Promise((resolve, reject) => {
      fn(...args, {
        success: (model: T) => {
          resolve(model);
        },
        error: (model: T, error: Error) => {
          reject(error);
        },
      });
    });
}
