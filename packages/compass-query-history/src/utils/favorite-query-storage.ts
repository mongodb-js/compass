import { promisifyAmpersandMethod } from '@mongodb-js/compass-utils';

import { FavoriteQueryCollection, FavoriteQuery } from '../models';
import type {
  FavoriteQueryAttributes,
  FavoriteQueryModelType,
} from '../models/favorite-query';

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
    const models = (await fetch()) as typeof FavoriteQueryCollection;
    return models.map((model: FavoriteQueryModelType) => {
      return model.getAttributes({ props: true }, true);
    });
  }

  /**
   * Updates attributes of the model.
   */
  async updateAttributes(
    modelId: string,
    attributes: Partial<FavoriteQueryAttributes>
  ) {
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

    const save = promisifyAmpersandMethod(model.save.bind(model)) as any;
    await save(model);
    return model.getAttributes({ props: true }, true);
  }

  /**
   * Deletes a query from the storage.
   */
  async delete(modelId: string) {
    const model = new FavoriteQuery({ _id: modelId });
    const destroy = promisifyAmpersandMethod(model.destroy.bind(model));
    return destroy();
  }
}
