import { promisifyAmpersandMethod } from 'mongodb-data-service';
import { FavoriteQueryCollection, FavoriteQuery } from '../models';

export class QueryStorage {
  fetch;
  sync;

  constructor() {
    const queryCollection = new FavoriteQueryCollection();

    this.fetch = promisifyAmpersandMethod(
      queryCollection.fetch.bind(queryCollection)
    );

    this.sync = promisifyAmpersandMethod(
      queryCollection.sync.bind(queryCollection)
    );
  }

  /**
   *
   * Loads all saved queries from the storage.
   *
   */
  async loadAll() {
    const models = await this.fetch();
    return models.map((model) => {
      return model.getAttributes({ props: true }, true);
    });
  }

  /**
   * Save/Update a Query Model. If model has _id, it will be updated.
   *
   * @param {object} model The model to create or update.
   */
  async save(model) {
    // If we are updating, find the existing model.
    // storage-mixin internally calls `_write` for both save/update
    // and it will override the existing data
    let data = {};
    if (model._id) {
      data = await this.sync('read', model._id);
    }
    const favoriteQuery = new FavoriteQuery({...data, ...model});
    return this.sync('update', favoriteQuery);
  }

  /**
   * Deletes a query from the storage.
   *
   * @param {string} modelId Model ID
   */
  delete(modelId) {
    this.sync('delete', modelId);
  }
}
