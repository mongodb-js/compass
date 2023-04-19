import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import { PipelineBuilderThunkAction } from '.';
import { getSchema } from '../utils/get-schema';

type CollectionType = 'collection' | 'view';
export type CollectionInfo = {
  name: string;
  type: CollectionType;
};

enum ActionTypes {
  CollectionsFetch = 'compass-aggregations/collectionsFetched',
  CollectionDataUpdated = 'compass-aggregations/collectionDataUpdated',
}

type CollectionsFetchedAction = {
  type: ActionTypes.CollectionsFetch;
  collections: CollectionInfo[];
};

type CollectionDataUpdatedAction = {
  type: ActionTypes.CollectionDataUpdated;
  collection: string;
  data: CollectionData;
};

type CollectionData = {
  isLoading: boolean;
  type: CollectionType;
  fields: string[];
};

type State = Record<string, CollectionData>;

export const INITIAL_STATE: State = {};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (
    isAction<CollectionsFetchedAction>(action, ActionTypes.CollectionsFetch)
  ) {
    return Object.fromEntries(
      action.collections.map((c) => [
        c.name,
        { isLoading: false, type: c.type, fields: [] },
      ])
    );
  }

  if (
    isAction<CollectionDataUpdatedAction>(
      action,
      ActionTypes.CollectionDataUpdated
    )
  ) {
    return {
      ...state,
      [action.collection]: action.data,
    };
  }

  return state;
}

export const setCollections = (
  collections: CollectionInfo[]
): CollectionsFetchedAction => ({
  type: ActionTypes.CollectionsFetch,
  collections,
});

export const fetchCollectionFields = (
  collection: string
): PipelineBuilderThunkAction<void, CollectionDataUpdatedAction> => {
  return async (dispatch, getState) => {
    const {
      collectionsFields,
      namespace,
      dataService: { dataService },
    } = getState();

    if (!dataService) {
      return;
    }

    // If we have the fields already, we don't do anything
    const collectionInfo = collectionsFields[collection];
    if (collectionInfo && collectionInfo.fields.length > 0) {
      dispatch({
        type: ActionTypes.CollectionDataUpdated,
        collection,
        data: {
          ...collectionInfo,
          isLoading: false,
        },
      });
      return;
    }

    dispatch({
      type: ActionTypes.CollectionDataUpdated,
      collection,
      data: {
        ...collectionInfo,
        fields: [],
        isLoading: true,
      },
    });

    const documents =
      collectionInfo.type === 'collection'
        ? await dataService.find(
            namespace,
            {},
            { sort: { $natural: -1 }, limit: 1 }
          )
        : await dataService.sample(namespace, { size: 1 });

    console.log({ documents, d: getSchema(documents) });

    dispatch({
      type: ActionTypes.CollectionDataUpdated,
      collection,
      data: {
        ...collectionInfo,
        fields: getSchema(documents),
        isLoading: false,
      },
    });
  };
};
