import { promisifyAmpersandMethod } from 'mongodb-data-service'
import { FavoriteQueryCollection } from '@mongodb-js/compass-query-history';

interface AmpersandQueryModel {
  getAttributes: (options: { props: boolean }) => Query;
}

export interface Query {
  _id: string;
  _name: string;
  _ns: string;
  _dateSaved: Date;
  collation?: Record<string, unknown>;
  filter?: Record<string, unknown>;
  limit?: number;
  project?: Record<string, unknown>;
  skip?: number;
  sort?: Record<string, number>;
};

export const getQueries = async (): Promise<Query[]> => {
  const collection = new FavoriteQueryCollection();
  const fetch = promisifyAmpersandMethod(
    collection.fetch.bind(collection)
  );
  return mapQueryModels(await fetch());
}

const mapQueryModels = (models: AmpersandQueryModel[]): Query[] => {
  return models.map((model: AmpersandQueryModel) => {
    return model.getAttributes({ props: true });
  });
};
