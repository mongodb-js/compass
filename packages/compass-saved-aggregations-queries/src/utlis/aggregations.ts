import { promisify } from 'util';
import { readPipelinesFromStorage } from '@mongodb-js/compass-aggregations';

export interface Aggregation {
  id: string;
  name: string;
  namespace: string;
  lastModified: number;
}

export const getAggregations = async (): Promise<Aggregation[]> => {
  const pipelines: Aggregation[] = await promisify(readPipelinesFromStorage)();
  return pipelines;
};
