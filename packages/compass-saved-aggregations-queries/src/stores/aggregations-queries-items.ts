import { remote } from 'electron';
import { join } from 'path';
import fs from 'fs';
import { FavoriteQueryCollection } from '@mongodb-js/compass-query-history';
interface Item {
  id: string;
  name: string;
  namespace: string;
  lastModified: number;
}

export interface Aggregation extends Item {
  pipeline: unknown[];
}

export interface Query extends Item {
  collation: Record<string, unknown>;
  filter: Record<string, unknown>;
  limit: number;
  project: Record<string, unknown>;
  skip: number;
  sort: Record<string, number>;
}

export type State = {
  loading: boolean;
  items: Array<Aggregation | Query>;
};

type Action = {
  type: string;
};

const INITIAL_STATE: State = {
  loading: true,
  items: [],
};

const FETCH_DATA = 'FETCH_DATA';

function reducer(state = INITIAL_STATE, action: Action): State {
  if (action.type === FETCH_DATA) {
    return {
      items: [...getAggregations(), ...getQueries()],
      loading: false,
    };
  }
  return state;
}

export const fetchItems = (): Action => ({
  type: FETCH_DATA
});

const getAggregations = () => {
  const dir = join(remote.app.getPath('userData'), 'SavedPipelines');
  const aggregations = fs
    .readdirSync(dir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => {
      const filePath = join(dir, file);
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      data.lastModified = fs.statSync(filePath).mtimeMs;
      return data;
    });
  return mapAggregations(aggregations);
};

const mapAggregations = (aggregations: unknown[]): Aggregation[] => {
  return aggregations.map((aggregation: any) => ({
    id: aggregation.id,
    name: aggregation.name,
    namespace: aggregation.namespace,
    lastModified: aggregation.lastModified,

    pipeline: aggregation.pipeline,
  }));
};

const getQueries = (): Query[] => {
  const collection = new FavoriteQueryCollection();
  collection.fetch({
    success: () => {
      // todo: return mapped list here
    },
  });
  return mapQueryModels(collection.models);
};

const mapQueryModels = (models: unknown[]): Query[] => {
  return models.map((model: any) => {
    const { _values } = model;
    return {
      id: _values._id,
      name: _values._name,
      namespace: _values._ns,
      lastModified: _values.dateSaved,

      collation: _values.collation,
      filter: _values.filter,
      limit: _values.limit,
      project: _values.project,
      skip: _values.skip,
      sort: _values.sort,
    };
  });
};

export default reducer;
