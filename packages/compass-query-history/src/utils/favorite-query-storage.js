import { promisifyAmpersandMethod } from 'mongodb-data-service';
import { FavoriteQueryCollection, FavoriteQuery } from '../models';

export class FavoriteQueryStorage {
  /**
   *
   * Loads all saved queries from the storage.
   *
   */
  async loadAll() {
    const queryCollection = new FavoriteQueryCollection();
    const fetch = promisifyAmpersandMethod(
      queryCollection.fetch.bind(queryCollection)
    );
    const models = await fetch();
    return models.map((model) => {
      return model.getAttributes({ props: true }, true);
    });
  }

  /**
   * Updates attributes of the model.
   *
   * @param {string} modelId ID of the model to update
   * @param {object} attributes Attributes of model to update
   */
  async updateAttributes(modelId, attributes) {
    if (!modelId) {
      throw new Error('modelId is required');
    }
    const model = new FavoriteQuery({ _id: modelId });

    const fetch = promisifyAmpersandMethod(model.fetch.bind(model));

    await fetch();

    model.set({
      ...attributes,
      _dateModified: Date.now(),
    });

    const save = promisifyAmpersandMethod(model.save.bind(model));
    await save(model);
    return model.getAttributes({ props: true }, true);
  }

  /**
   * Deletes a query from the storage.
   *
   * @param {string} modelId Model ID
   */
  async delete(modelId) {
    const model = new FavoriteQuery({ _id: modelId });
    const destroy = promisifyAmpersandMethod(model.destroy.bind(model));
    return destroy();
  }
}
