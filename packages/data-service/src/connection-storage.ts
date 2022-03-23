import type { ConnectionInfo } from './connection-info';

import { validate as uuidValidate } from 'uuid';
import type {
  AmpersandMethodOptions,
  LegacyConnectionModel,
} from './legacy/legacy-connection-model';
import {
  convertConnectionInfoToModel,
  convertConnectionModelToInfo,
} from './legacy/legacy-connection-model';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { log, mongoLogId } = createLoggerAndTelemetry('COMPASS-DATA-SERVICE');

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

    try {
      await fetchConnectionModels();
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_101),
        'Connection Storage',
        'Failed to load connection, error while fetching models',
        { message: (err as Error).message }
      );

      return [];
    }

    return connectionCollection
      .map((model: LegacyConnectionModel) => {
        try {
          return convertConnectionModelToInfo(model);
        } catch (err) {
          log.error(
            mongoLogId(1_001_000_102),
            'Connection Storage',
            'Failed to load connection, error while converting from model',
            { message: (err as Error).message }
          );
        }
      })
      .filter(Boolean);
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
    try {
      if (!connectionInfo.id) {
        throw new Error('id is required');
      }

      if (!uuidValidate(connectionInfo.id)) {
        throw new Error('id must be a uuid');
      }

      const model = await convertConnectionInfoToModel(connectionInfo);
      await new Promise((resolve, reject) => {
        model.save(undefined, {
          success: resolve,
          error: reject,
        });
      });
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_103),
        'Connection Storage',
        'Failed to save connection',
        { message: (err as Error).message }
      );

      throw err;
    }
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
   * @param connectionInfo - The ConnectionInfo object to be deleted.
   */
  async delete(connectionInfo: ConnectionInfo): Promise<void> {
    if (!connectionInfo.id) {
      // don't throw attempting to delete a connection
      // that was never saved.
      return;
    }

    try {
      const model = await convertConnectionInfoToModel(connectionInfo);
      model.destroy();
    } catch (err) {
      log.error(
        mongoLogId(1_001_000_104),
        'Connection Storage',
        'Failed to delete connection',
        { message: (err as Error).message }
      );

      throw err;
    }
  }

  /**
   * Fetch one ConnectionInfo.
   *
   * @param {string} id Id of the ConnectionInfo to fetch
   */
  async load(id: string): Promise<ConnectionInfo | undefined> {
    if (!id) {
      return undefined;
    }

    // model.fetch doesn't seem to fail or return any useful info
    // to determine if the model exists or not on disk
    // this is why here we have to re-load all the connections in
    // in order to ensure we can return undefined for a connection id
    // that does not exist.

    const connections = await this.loadAll();

    return connections.find((connection) => id === connection.id);
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
