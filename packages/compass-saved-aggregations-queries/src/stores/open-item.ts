import type { ActionCreator, Reducer } from 'redux';
import type { SavedQueryAggregationThunkAction } from '.';
import type { Item } from './aggregations-queries-items';

export type Status = 'initial' | 'fetching' | 'error' | 'ready';

export type State = {
  isModalOpen: boolean;
  selectedItem: Item | null;
  createCollectionStatus: Status;
  databases: string[];
  selectedDatabase: string | null;
  databasesStatus: Status;
  collections: string[];
  selectedCollection: string | null;
  collectionsStatus: Status;
};

const INITIAL_STATE: State = {
  isModalOpen: false,
  selectedItem: null,
  createCollectionStatus: 'initial',
  databases: [],
  selectedDatabase: null,
  databasesStatus: 'initial',
  collections: [],
  selectedCollection: null,
  collectionsStatus: 'initial',
};

export enum ActionTypes {
  OpenModal = 'compass-saved-aggregations-queries/openModal',
  CloseModal = 'compass-saved-aggregations-queries/closeModal',
  CreateNamespaceStatusChange = 'compass-saved-aggregations-queries/createNamespaceStatusChange',
  SelectDatabase = 'compass-saved-aggregations-queries/selectDatabase',
  LoadDatabases = 'compass-saved-aggregations-queries/loadDatabases',
  LoadDatabasesSuccess = 'compass-saved-aggregations-queries/loadDatabasesSuccess',
  LoadDatabasesError = 'compass-saved-aggregations-queries/loadDatabasesError',
  SelectCollection = 'compass-saved-aggregations-queries/selectCollection',
  LoadCollections = 'compass-saved-aggregations-queries/loadCollections',
  LoadCollectionsSuccess = 'compass-saved-aggregations-queries/loadCollectionsSuccess',
  LoadCollectionsError = 'compass-saved-aggregations-queries/loadCollectionsError',
}

type OpenModalAction = {
  type: ActionTypes.OpenModal;
  selectedItem: Item;
};

type CloseModalAction = {
  type: ActionTypes.CloseModal;
};

type CreateNamespaceStatusChangeAction = {
  type: ActionTypes.CreateNamespaceStatusChange;
  status: Status;
};

type SelectDatabaseAction = {
  type: ActionTypes.SelectDatabase;
  database: string;
};

type LoadDatabasesAction = {
  type: ActionTypes.LoadDatabases;
};

type LoadDatabasesSuccessAction = {
  type: ActionTypes.LoadDatabasesSuccess;
  databases: string[];
};

type LoadDatabasesErrorAction = {
  type: ActionTypes.LoadDatabasesError;
};

type SelectCollectionAction = {
  type: ActionTypes.SelectCollection;
  collection: string;
};

type LoadCollectionsAction = {
  type: ActionTypes.LoadCollections;
};

type LoadCollectionsSuccessAction = {
  type: ActionTypes.LoadCollectionsSuccess;
  collections: string[];
};

type LoadCollectionsErrorAction = {
  type: ActionTypes.LoadCollectionsError;
};

export type Actions =
  | OpenModalAction
  | CloseModalAction
  | CreateNamespaceStatusChangeAction
  | SelectDatabaseAction
  | LoadDatabasesAction
  | LoadDatabasesErrorAction
  | LoadDatabasesSuccessAction
  | SelectCollectionAction
  | LoadCollectionsAction
  | LoadCollectionsErrorAction
  | LoadCollectionsSuccessAction;

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.OpenModal:
      return {
        ...state,
        selectedItem: action.selectedItem,
        isModalOpen: true,
      };
    case ActionTypes.CloseModal:
      return { ...INITIAL_STATE };
    case ActionTypes.CreateNamespaceStatusChange:
      return {
        ...state,
        createCollectionStatus: action.status,
      };
    case ActionTypes.SelectDatabase:
      return {
        ...state,
        selectedDatabase: action.database,
        collections: [],
        collectionsStatus: 'initial',
        selectedCollection: null,
      };
    case ActionTypes.LoadDatabases:
      return {
        ...state,
        databasesStatus: 'fetching',
      };
    case ActionTypes.LoadDatabasesError:
      return {
        ...state,
        databasesStatus: 'error',
      };
    case ActionTypes.LoadDatabasesSuccess:
      return {
        ...state,
        databases: action.databases,
        databasesStatus: 'ready',
      };
    case ActionTypes.SelectCollection:
      return {
        ...state,
        selectedCollection: action.collection,
      };
    case ActionTypes.LoadCollections:
      return {
        ...state,
        collectionsStatus: 'fetching',
      };
    case ActionTypes.LoadCollectionsError:
      return {
        ...state,
        collectionsStatus: 'error',
      };
    case ActionTypes.LoadCollectionsSuccess:
      return {
        ...state,
        collections: action.collections,
        collectionsStatus: 'ready',
      };
    default:
      return state;
  }
};

const openModal =
  (selectedItem: Item): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, _getState, { instance, dataService }) => {
    dispatch({ type: ActionTypes.OpenModal, selectedItem });

    dispatch({ type: ActionTypes.LoadDatabases });

    try {
      await instance.fetchDatabases({ dataService });
      dispatch({
        type: ActionTypes.LoadDatabasesSuccess,
        databases: instance.databases.map((db) => db.name),
      });
    } catch {
      dispatch({ type: ActionTypes.LoadDatabasesError });
    }
  };

export const closeModal: ActionCreator<CloseModalAction> = () => {
  return { type: ActionTypes.CloseModal };
};

const openItem =
  (
    item: Item,
    database: string,
    collection: string
  ): SavedQueryAggregationThunkAction<void> =>
  (_dispatch, _getState, { globalAppRegistry, logger: { track } }) => {
    track(
      item.type === 'aggregation'
        ? 'Aggregation Opened'
        : 'Query History Favorite Used',
      {
        id: item.id,
        screen: 'my_queries',
      }
    );

    globalAppRegistry.emit('my-queries-open-saved-item', {
      ns: `${database}.${collection}`,
      aggregation: item.type === 'aggregation' ? item.aggregation : null,
      query: item.type === 'query' ? item.query : null,
    });
  };

export const openSavedItem =
  (id: string): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, getState, { instance, dataService }) => {
    const {
      savedItems: { items },
    } = getState();

    const item = items.find((item) => item.id === id);

    if (!item) {
      return;
    }

    const { database, collection } = item;

    const coll = await instance.getNamespace({
      dataService,
      database,
      collection,
    });

    if (!coll) {
      void dispatch(openModal(item));
      return;
    }

    dispatch(openItem(item, database, collection));
  };

export const openSelectedItem =
  (): SavedQueryAggregationThunkAction<void> => (dispatch, getState) => {
    const {
      openItem: { selectedItem, selectedDatabase, selectedCollection },
    } = getState();

    if (!selectedItem || !selectedDatabase || !selectedCollection) {
      return;
    }

    dispatch({ type: ActionTypes.CloseModal });
    dispatch(openItem(selectedItem, selectedDatabase, selectedCollection));
  };

export const selectDatabase =
  (database: string): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, getState, { instance, dataService }) => {
    const {
      openItem: { selectedDatabase },
    } = getState();

    if (database === selectedDatabase) {
      return;
    }

    dispatch({ type: ActionTypes.SelectDatabase, database });

    const db = instance.databases.get(database);

    if (!db) {
      return;
    }

    try {
      await db.fetchCollections({ dataService });
      // Check with the the current value in case db was re-selected while we
      // were fetching
      if (database === getState().openItem.selectedDatabase) {
        dispatch({
          type: ActionTypes.LoadCollectionsSuccess,
          collections: db.collections.map((coll) => coll.name),
        });
      }
    } catch {
      // Check with the the current value in case db was re-selected while we
      // were fetching
      if (database === getState().openItem.selectedDatabase) {
        dispatch({ type: ActionTypes.LoadCollectionsError });
      }
    }
  };

export const selectCollection: ActionCreator<SelectCollectionAction> = (
  collection: string
) => {
  return { type: ActionTypes.SelectCollection, collection };
};

export default reducer;
