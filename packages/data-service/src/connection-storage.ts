import { ConnectionOptions } from './connection-options';

import {
  convertConnectionModelToOptions,
  convertConnectionOptionsToModel,
  AmpersandMethodOptions,
} from './legacy-connection-model';

type ConnectionOptionsWithRequiredId = ConnectionOptions &
  Required<Pick<ConnectionOptions, 'id'>>;

import { validate as uuidValidate } from 'uuid';

export class ConnectionStorage {
  /**
   * Loads all the ConnectionOptions currently stored.
   *
   * @returns Promise<ConnectionOptions[]>
   */
  async loadAll(): Promise<ConnectionOptions[]> {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { ConnectionCollection } = require('mongodb-connection-model');
    const connectionCollection = new ConnectionCollection();
    const fetchConnectionModels = promisifyAmpersandMethod(
      connectionCollection.fetch.bind(connectionCollection)
    );

    await fetchConnectionModels();
    return connectionCollection.map(convertConnectionModelToOptions);
  }

  /**
   * Inserts or replaces a ConnectionOptions object in the storage.
   *
   * The ConnectionOptions object must have an id set to a string
   * matching the uuid format.
   *
   * @param connectionOptions - The ConnectionOptions object to be saved.
   */
  async save(
    connectionOptions: ConnectionOptionsWithRequiredId
  ): Promise<void> {
    if (!connectionOptions.id) {
      throw new Error('id is required');
    }

    if (!uuidValidate(connectionOptions.id)) {
      throw new Error('id must be a uuid');
    }

    const model = await convertConnectionOptionsToModel(connectionOptions);
    model.save();
  }

  /**
   * Deletes a ConnectionOptions object from the storage.
   *
   * If the ConnectionOptions does not have an id, the operation will
   * ignore and return.
   *
   * Trying to remove a ConnectionOptions that is not stored has no effect
   * and won't throw an exception.
   *
   * @param connectionOptions - The ConnectionOptions object to be deleted.
   */
  async delete(
    connectionOptions: ConnectionOptionsWithRequiredId
  ): Promise<void> {
    if (!connectionOptions.id) {
      // don't throw attempting to delete a connection
      // that was never saved.
      return;
    }

    const model = await convertConnectionOptionsToModel(connectionOptions);
    model.destroy();
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
