import type { DataService } from 'mongodb-data-service';
import type { PreferencesAccess } from 'compass-preferences-model/provider';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model/provider';

import type { ExportAggregation, ExportQuery } from './export-types';

export function createAggregationCursor({
  ns,
  aggregation,
  dataService,
  preferences,
}: {
  ns: string;
  dataService: Pick<DataService, 'aggregateCursor'>;
  preferences: PreferencesAccess;
  aggregation: ExportAggregation;
}) {
  const { stages, options: aggregationOptions = {} } = aggregation;
  aggregationOptions.maxTimeMS = capMaxTimeMSAtPreferenceLimit(
    preferences,
    aggregationOptions.maxTimeMS
  );
  aggregationOptions.promoteValues = false;
  aggregationOptions.bsonRegExp = true;
  return dataService.aggregateCursor(ns, stages, aggregationOptions);
}

export function createFindCursor({
  ns,
  query,
  dataService,
}: {
  ns: string;
  dataService: Pick<DataService, 'findCursor'>;
  query: ExportQuery;
}) {
  return dataService.findCursor(ns, query.filter ?? {}, {
    projection: query.projection,
    sort: query.sort,
    limit: query.limit,
    skip: query.skip,
    collation: query.collation,
    promoteValues: false,
    bsonRegExp: true,
  });
}
