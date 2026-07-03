import type { Reducer } from 'redux';
import type { Collection } from '@mongodb-js/compass-app-stores/provider';
import { isAction } from '../utils/is-action';

export type CollectionStats = Pick<
  Collection,
  'document_count' | 'storage_size' | 'free_storage_size' | 'avg_document_size'
>;

export function extractCollectionStats(
  collection: Collection
): CollectionStats {
  const coll = collection.toJSON();
  return {
    document_count: coll.document_count,
    storage_size: coll.storage_size,
    free_storage_size: coll.free_storage_size,
    avg_document_size: coll.avg_document_size,
  };
}

export type CollectionMetaState = {
  version: string;
  isDataLake: boolean;
  isReadonly: boolean;
  isTimeSeries: boolean;
  isWritable: boolean;
  instanceDescription: string;
  isSearchIndexesSupported: boolean;
  isUpdatePreviewSupported: boolean;
  collectionStats: CollectionStats | null;
};

export const CollectionMetaActionTypes = {
  IS_WRITABLE_CHANGED: 'crud/collection-meta/IS_WRITABLE_CHANGED',
  INSTANCE_DESCRIPTION_CHANGED:
    'crud/collection-meta/INSTANCE_DESCRIPTION_CHANGED',
  COLLECTION_STATS_FETCHED: 'crud/collection-meta/COLLECTION_STATS_FETCHED',
} as const;

export type IsWritableChangedAction = {
  type: typeof CollectionMetaActionTypes.IS_WRITABLE_CHANGED;
  isWritable: boolean;
};

export type InstanceDescriptionChangedAction = {
  type: typeof CollectionMetaActionTypes.INSTANCE_DESCRIPTION_CHANGED;
  instanceDescription: string;
};

export type CollectionStatsFetchedAction = {
  type: typeof CollectionMetaActionTypes.COLLECTION_STATS_FETCHED;
  collectionStats: CollectionStats;
};

export type CollectionMetaActions =
  | IsWritableChangedAction
  | InstanceDescriptionChangedAction
  | CollectionStatsFetchedAction;

export function createCollectionMetaReducer(
  initialState: CollectionMetaState
): Reducer<CollectionMetaState> {
  return (state = initialState, action) => {
    if (isAction(action, CollectionMetaActionTypes.IS_WRITABLE_CHANGED)) {
      return { ...state, isWritable: action.isWritable };
    }
    if (
      isAction(action, CollectionMetaActionTypes.INSTANCE_DESCRIPTION_CHANGED)
    ) {
      return { ...state, instanceDescription: action.instanceDescription };
    }
    if (isAction(action, CollectionMetaActionTypes.COLLECTION_STATS_FETCHED)) {
      return { ...state, collectionStats: action.collectionStats };
    }
    return state;
  };
}

export function isWritableChanged(
  isWritable: boolean
): IsWritableChangedAction {
  return {
    type: CollectionMetaActionTypes.IS_WRITABLE_CHANGED,
    isWritable,
  };
}

export function instanceDescriptionChanged(
  instanceDescription: string
): InstanceDescriptionChangedAction {
  return {
    type: CollectionMetaActionTypes.INSTANCE_DESCRIPTION_CHANGED,
    instanceDescription,
  };
}

export function collectionStatsFetched(
  collection: Collection
): CollectionStatsFetchedAction {
  return {
    type: CollectionMetaActionTypes.COLLECTION_STATS_FETCHED,
    collectionStats: extractCollectionStats(collection),
  };
}
