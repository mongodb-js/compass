import type { ActionCreator, AnyAction, Reducer } from 'redux';
import type { SavedQueryAggregationThunkAction } from '.';
import type { Item } from './aggregations-queries-items';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type Status = 'initial' | 'fetching' | 'error' | 'ready';

export type State = {
  isModalOpen: boolean;
  selectedItem: Item | null;
  activeConnections: string[];
  selectedConnection: string | null;
  databases: string[];
  selectedDatabase: string | null;
  databasesStatus: Status;
  collections: string[];
  selectedCollection: string | null;
  collectionsStatus: Status;
  updateItemNamespace: boolean;
};

const INITIAL_STATE: State = {
  isModalOpen: false,
  selectedItem: null,
  activeConnections: [],
  selectedConnection: null,
  databases: [],
  selectedDatabase: null,
  databasesStatus: 'initial',
  collections: [],
  selectedCollection: null,
  collectionsStatus: 'initial',
  updateItemNamespace: false,
};

export enum ActionTypes {
  OpenModal = 'compass-saved-aggregations-queries/openModal',
  CloseModal = 'compass-saved-aggregations-queries/closeModal',
  ConnectionConnected = 'compass-saved-aggregations-queries/connectionConnected',
  ConnectionDisconnected = 'compass-saved-aggregations-queries/connectionDisconnected',
  ConnectionSelected = 'compass-saved-aggregations-queries/connectionSelected',
  SelectDatabase = 'compass-saved-aggregations-queries/selectDatabase',
  LoadDatabases = 'compass-saved-aggregations-queries/loadDatabases',
  LoadDatabasesSuccess = 'compass-saved-aggregations-queries/loadDatabasesSuccess',
  LoadDatabasesError = 'compass-saved-aggregations-queries/loadDatabasesError',
  SelectCollection = 'compass-saved-aggregations-queries/selectCollection',
  LoadCollections = 'compass-saved-aggregations-queries/loadCollections',
  LoadCollectionsSuccess = 'compass-saved-aggregations-queries/loadCollectionsSuccess',
  LoadCollectionsError = 'compass-saved-aggregations-queries/loadCollectionsError',
  UpdateNamespaceChecked = 'compass-saved-aggregations-queries/updateNamespaceChecked',
}

type OpenModalAction = {
  type: ActionTypes.OpenModal;
  selectedItem: Item;
};

type CloseModalAction = {
  type: ActionTypes.CloseModal;
};

type ConnectionConnectedAction = {
  type: ActionTypes.ConnectionConnected;
  connection: string;
};

type ConnectionDisconnectedAction = {
  type: ActionTypes.ConnectionDisconnected;
  connection: string;
};

type ConnectionSelectedAction = {
  type: ActionTypes.ConnectionSelected;
  connection: string;
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

type UpdateNamespaceCheckedAction = {
  type: ActionTypes.UpdateNamespaceChecked;
  updateItemNamespace: boolean;
};

export type Actions =
  | OpenModalAction
  | CloseModalAction
  | ConnectionConnectedAction
  | ConnectionDisconnectedAction
  | ConnectionSelectedAction
  | SelectDatabaseAction
  | LoadDatabasesAction
  | LoadDatabasesErrorAction
  | LoadDatabasesSuccessAction
  | SelectCollectionAction
  | LoadCollectionsAction
  | LoadCollectionsErrorAction
  | LoadCollectionsSuccessAction
  | UpdateNamespaceCheckedAction;

const reducer: Reducer<State> = (state = INITIAL_STATE, action) => {
  if (isAction<OpenModalAction>(action, ActionTypes.OpenModal)) {
    return {
      ...state,
      selectedItem: action.selectedItem,
      isModalOpen: true,
    };
  }

  if (isAction<CloseModalAction>(action, ActionTypes.CloseModal)) {
    return { ...INITIAL_STATE };
  }

  if (
    isAction<ConnectionConnectedAction>(action, ActionTypes.ConnectionConnected)
  ) {
    const activeConnections = new Set(state.activeConnections);
    activeConnections.add(action.connection);

    return {
      ...state,
      activeConnections: Array.from(activeConnections),
    };
  }

  if (
    isAction<ConnectionDisconnectedAction>(
      action,
      ActionTypes.ConnectionDisconnected
    )
  ) {
    const activeConnections = new Set(state.activeConnections);
    activeConnections.delete(action.connection);

    return {
      ...state,
      activeConnections: Array.from(activeConnections),
    };
  }

  if (
    isAction<ConnectionSelectedAction>(action, ActionTypes.ConnectionSelected)
  ) {
    return {
      ...state,
      selectedConnection: action.connection,
      selectedDatabase: null,
      databases: [],
      databasesStatus: 'initial',
      collections: [],
      collectionsStatus: 'initial',
      selectedCollection: null,
    };
  }

  if (isAction<SelectDatabaseAction>(action, ActionTypes.SelectDatabase)) {
    return {
      ...state,
      selectedDatabase: action.database,
      collections: [],
      collectionsStatus: 'initial',
      selectedCollection: null,
    };
  }

  if (isAction<LoadDatabasesAction>(action, ActionTypes.LoadDatabases)) {
    return {
      ...state,
      databasesStatus: 'fetching',
    };
  }

  if (
    isAction<LoadDatabasesErrorAction>(action, ActionTypes.LoadDatabasesError)
  ) {
    return {
      ...state,
      databasesStatus: 'error',
    };
  }

  if (
    isAction<LoadDatabasesSuccessAction>(
      action,
      ActionTypes.LoadDatabasesSuccess
    )
  ) {
    return {
      ...state,
      databases: action.databases,
      databasesStatus: 'ready',
    };
  }

  if (isAction<SelectCollectionAction>(action, ActionTypes.SelectCollection)) {
    return {
      ...state,
      selectedCollection: action.collection,
    };
  }

  if (isAction<LoadCollectionsAction>(action, ActionTypes.LoadCollections)) {
    return {
      ...state,
      collectionsStatus: 'fetching',
    };
  }

  if (
    isAction<LoadCollectionsErrorAction>(
      action,
      ActionTypes.LoadCollectionsError
    )
  ) {
    return {
      ...state,
      collectionsStatus: 'error',
    };
  }

  if (
    isAction<LoadCollectionsSuccessAction>(
      action,
      ActionTypes.LoadCollectionsSuccess
    )
  ) {
    return {
      ...state,
      collections: action.collections,
      collectionsStatus: 'ready',
    };
  }

  if (
    isAction<UpdateNamespaceCheckedAction>(
      action,
      ActionTypes.UpdateNamespaceChecked
    )
  ) {
    return {
      ...state,
      updateItemNamespace: action.updateItemNamespace,
    };
  }

  return state;
};

export const connectionConnected = (
  connection: string
): ConnectionConnectedAction => ({
  type: ActionTypes.ConnectionConnected,
  connection,
});

export const connectionDisconnected = (
  connection: string
): ConnectionDisconnectedAction => ({
  type: ActionTypes.ConnectionDisconnected,
  connection,
});

export const connectionSelected = (
  connection: string
): ConnectionSelectedAction => ({
  type: ActionTypes.ConnectionSelected,
  connection,
});

export const updateItemNamespaceChecked = (updateItemNamespace: boolean) => ({
  type: ActionTypes.UpdateNamespaceChecked,
  updateItemNamespace,
});

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
  (
    _dispatch,
    _getState,
    { logger: { track }, workspaces, connectionInfoAccess }
  ) => {
    track(
      item.type === 'aggregation'
        ? 'Aggregation Opened'
        : 'Query History Favorite Used',
      {
        id: item.id,
        screen: 'my_queries',
      }
    );

    const { id: connectionId } =
      connectionInfoAccess.getCurrentConnectionInfo();

    workspaces.openCollectionWorkspace(
      connectionId,
      `${database}.${collection}`,
      {
        initialAggregation:
          item.type === 'aggregation' ? item.aggregation : undefined,
        initialQuery:
          item.type === 'query' || item.type === 'updatemany'
            ? item.query
            : undefined,
        newTab: true,
      }
    );
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
  (): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, getState, { queryStorage, pipelineStorage }) => {
    const {
      openItem: {
        selectedItem,
        selectedDatabase,
        selectedCollection,
        updateItemNamespace,
      },
    } = getState();

    if (!selectedItem || !selectedDatabase || !selectedCollection) {
      return;
    }

    if (updateItemNamespace) {
      const id = selectedItem.id;
      const newNamespace = `${selectedDatabase}.${selectedCollection}`;

      if (selectedItem.type === 'aggregation') {
        await pipelineStorage?.updateAttributes(id, {
          namespace: newNamespace,
        });
      } else if (selectedItem.type === 'query') {
        await queryStorage?.updateAttributes(id, { _ns: newNamespace });
      }
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
