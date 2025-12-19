import type { DataService as OriginalDataService } from 'mongodb-data-service';

type FetchCollectionMetadataDataServiceMethods =
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections'
  | 'isListSearchIndexesSupported';

export type RequiredDataServiceProps =
  | FetchCollectionMetadataDataServiceMethods
  | 'isCancelError'
  | 'estimatedCount'
  | 'aggregate'
  | 'getConnectionString'
  | 'updateCollection'
  | 'getCurrentTopologyType'
  | 'instance';
export type OptionalDataServiceProps =
  | 'explainAggregate'
  | 'getSearchIndexes'
  | 'find'
  | 'sample';

export type DataService = Pick<OriginalDataService, RequiredDataServiceProps> &
  // Optional methods for getting insights
  Partial<Pick<OriginalDataService, OptionalDataServiceProps>>;

export type DataServiceState = {
  dataService: DataService | null;
};

/**
 * The initial state.
 */
export const INITIAL_STATE: DataServiceState = {
  dataService: null,
};

/**
 * Reducer function for handling data service connected actions.
 */
export default function reducer(state = INITIAL_STATE): DataServiceState {
  return state;
}
