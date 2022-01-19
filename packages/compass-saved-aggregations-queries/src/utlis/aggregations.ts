import { promisify } from 'util';
import { readPipelinesFromStorage } from '@mongodb-js/compass-aggregations';

export interface Aggregation {
  id: string;
  name: string;
  namespace: string;
  lastModified: number;
  autoPreview?: boolean;
  collation?: string;
  collationString?: string;
  comments?: boolean;
  env?: string;
  isReadonly?: boolean;
  isTimeSeries?: boolean;
  pipeline: unknown[];
  sample?: boolean;
  sourceName?: string;
};

export const getAggregations = async (): Promise<Aggregation[]> => {
  const pipelines: Aggregation[] = await promisify(readPipelinesFromStorage)();
  return pipelines;
};
