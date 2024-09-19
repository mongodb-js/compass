import type { DataService as OriginalDataService } from 'mongodb-data-service';

export type RequiredDataServiceProps =
  | 'find'
  | 'aggregate'
  | 'isCancelError'
  | 'previewUpdate'
  | 'deleteOne'
  | 'knownSchemaForCollection'
  | 'updateMany'
  | 'insertMany'
  | 'insertOne'
  | 'isConnected'
  | 'explainFind'
  | 'deleteMany'
  | 'findOneAndUpdate'
  | 'findOneAndReplace'
  | 'updateOne'
  | 'replaceOne'
  // Required for collection model (fetching stats)
  | 'collectionStats'
  | 'collectionInfo'
  | 'listCollections'
  | 'isListSearchIndexesSupported';
// TODO: It might make sense to refactor the DataService interface to be closer to
// { ..., getCSFLEMode(): 'unavailable' } | {  ..., getCSFLEMode(): 'unavailable' | 'enabled' | 'disabled', isUpdateAllowed(): ..., knownSchemaForCollection(): ... }
// so that either these methods are always present together or always absent
export type OptionalDataServiceProps =
  | 'getCSFLEMode'
  | 'isUpdateAllowed'
  | 'knownSchemaForCollection';

export type DataService = Pick<OriginalDataService, RequiredDataServiceProps> &
  Partial<Pick<OriginalDataService, OptionalDataServiceProps>>;
