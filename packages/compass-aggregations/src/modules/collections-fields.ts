import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';
import type { PipelineBuilderThunkAction } from '.';
import { getSchema } from '../utils/get-schema';
import toNS from 'mongodb-ns';
import { isEqual } from 'lodash';

type CollectionType = 'collection' | 'view';
export type CollectionInfo = {
  name: string;
  type: CollectionType;
};

export enum ActionTypes {
  CollectionsFetch = 'compass-aggregations/collectionsFetched',
  CollectionFieldsFetched = 'compass-aggregations/collectionFieldsFetched',
  CollectionDataUpdated = 'compass-aggregations/collectionDataUpdated',
}

type CollectionsFetchedAction = {
  type: ActionTypes.CollectionsFetch;
  data: State;
};

type CollectionFieldsFetchedAction = {
  type: ActionTypes.CollectionFieldsFetched;
  collection: string;
  fields: string[];
  collectionType: CollectionType;
};

type CollectionDataUpdatedAction = {
  type: ActionTypes.CollectionDataUpdated;
  collection: string;
  data: CollectionData;
};

export type CollectionData = {
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
    return action.data;
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

  if (
    isAction<CollectionFieldsFetchedAction>(
      action,
      ActionTypes.CollectionFieldsFetched
    )
  ) {
    return {
      ...state,
      [action.collection]: {
        isLoading: false,
        fields: action.fields,
        type: action.collectionType,
      },
    };
  }

  return state;
}

export const setCollections = (
  collections: CollectionInfo[]
): PipelineBuilderThunkAction<void, CollectionsFetchedAction> => {
  return (dispatch, getState) => {
    const currentData = getState().collectionsFields;

    const newData: State = {};
    collections.forEach(({ name, type }) => {
      newData[name] = currentData[name] ?? {
        fields: [],
        isLoading: false,
        type,
      };
    });

    if (isEqual(Object.keys(currentData), Object.keys(newData))) {
      return;
    }

    dispatch({
      type: ActionTypes.CollectionsFetch,
      data: newData,
    });
  };
};

export const setCollectionFields = (
  collection: string,
  collectionType: CollectionType,
  fields: string[]
): CollectionFieldsFetchedAction => ({
  type: ActionTypes.CollectionFieldsFetched,
  collection,
  fields,
  collectionType,
});

export const fetchCollectionFields = (
  collection: string
): PipelineBuilderThunkAction<Promise<void>, CollectionDataUpdatedAction> => {
  return async (dispatch, getState) => {
    const {
      collectionsFields,
      namespace,
      dataService: { dataService },
    } = getState();

    if (!dataService) {
      return;
    }

    const collectionInfo = collectionsFields[collection];
    if (collectionInfo && collectionInfo.fields.length > 0) {
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

    try {
      const { database } = toNS(namespace);
      const namespaceToQuery = `${database}.${collection}`;

      const documents =
        collectionInfo.type === 'collection'
          ? await dataService.find(
              namespaceToQuery,
              {},
              { sort: { $natural: -1 }, limit: 1 }
            )
          : await dataService.sample(namespaceToQuery, { size: 1 });

      dispatch({
        type: ActionTypes.CollectionDataUpdated,
        collection,
        data: {
          ...collectionInfo,
          fields: getSchema(documents),
          isLoading: false,
        },
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.CollectionDataUpdated,
        collection,
        data: {
          ...collectionInfo,
          fields: [],
          isLoading: false,
        },
      });
    }
  };
};
