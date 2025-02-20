import type { Action, ActionCreator, AnyAction, Reducer } from 'redux';
import type { SavedQueryAggregationThunkAction } from '.';
import type { Item } from './aggregations-queries-items';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';
import { getConnectionTitle } from '@mongodb-js/connection-info';

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type Status = 'initial' | 'fetching' | 'error' | 'ready';

export type OpenedModal =
  | 'select-connection-and-namespace-modal'
  | 'namespace-not-found-modal'
  | 'select-connection-modal'
  | 'no-active-connections-modal';

export type State = {
  openedModal: OpenedModal | null;
  selectedItem: Item | null;
  connections: { id: string; name: string; color?: string }[];
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
  openedModal: null,
  selectedItem: null,
  connections: [],
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
  ConnectionSelected = 'compass-saved-aggregations-queries/connectionSelected',
  ConnectionSelectedForPreSelectedNamespace = 'compass-saved-aggregations-queries/connectionSelectedForPreSelectedNamespace',
  DatabaseSelected = 'compass-saved-aggregations-queries/DatabaseSelected',
  LoadDatabases = 'compass-saved-aggregations-queries/loadDatabases',
  LoadDatabasesSuccess = 'compass-saved-aggregations-queries/loadDatabasesSuccess',
  LoadDatabasesError = 'compass-saved-aggregations-queries/loadDatabasesError',
  CollectionSelected = 'compass-saved-aggregations-queries/collectionSelected',
  LoadCollections = 'compass-saved-aggregations-queries/loadCollections',
  LoadCollectionsSuccess = 'compass-saved-aggregations-queries/loadCollectionsSuccess',
  LoadCollectionsError = 'compass-saved-aggregations-queries/loadCollectionsError',
  UpdateNamespaceChecked = 'compass-saved-aggregations-queries/updateNamespaceChecked',
}

type OpenModalAction = {
  type: ActionTypes.OpenModal;
  modal: OpenedModal;
  connections: State['connections'];
  selectedItem?: Item;
  selectedConnection?: string;
  selectedDatabase?: string;
  selectedCollection?: string;
};

type CloseModalAction = {
  type: ActionTypes.CloseModal;
};

type ConnectionSelectedAction = {
  type: ActionTypes.ConnectionSelected;
  selectedConnection: string;
};

// Supposed to happen when a connection is selected without destroying the
// pre-selected namespace(database / collection) state in the store
type ConnectionSelectedForPreSelectedNamespaceAction = {
  type: ActionTypes.ConnectionSelectedForPreSelectedNamespace;
  selectedConnection: string;
};

type DatabaseSelectedAction = {
  type: ActionTypes.DatabaseSelected;
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

type CollectionSelectedAction = {
  type: ActionTypes.CollectionSelected;
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
  | ConnectionSelectedAction
  | ConnectionSelectedForPreSelectedNamespaceAction
  | DatabaseSelectedAction
  | LoadDatabasesAction
  | LoadDatabasesErrorAction
  | LoadDatabasesSuccessAction
  | CollectionSelectedAction
  | LoadCollectionsAction
  | LoadCollectionsErrorAction
  | LoadCollectionsSuccessAction
  | UpdateNamespaceCheckedAction;

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<OpenModalAction>(action, ActionTypes.OpenModal)) {
    return {
      ...state,
      openedModal: action.modal,
      connections: action.connections,
      selectedItem: action.selectedItem ?? state.selectedItem,
      selectedConnection: action.selectedConnection ?? state.selectedConnection,
      selectedDatabase: action.selectedDatabase ?? state.selectedDatabase,
      selectedCollection: action.selectedCollection ?? state.selectedCollection,
    };
  }

  if (isAction<CloseModalAction>(action, ActionTypes.CloseModal)) {
    return { ...INITIAL_STATE };
  }

  if (
    isAction<ConnectionSelectedAction>(action, ActionTypes.ConnectionSelected)
  ) {
    return {
      ...state,
      selectedConnection: action.selectedConnection,
      selectedDatabase: null,
      databases: [],
      databasesStatus: 'initial',
      collections: [],
      collectionsStatus: 'initial',
      selectedCollection: null,
    };
  }

  if (
    isAction<ConnectionSelectedForPreSelectedNamespaceAction>(
      action,
      ActionTypes.ConnectionSelectedForPreSelectedNamespace
    )
  ) {
    return {
      ...state,
      selectedConnection: action.selectedConnection,
    };
  }

  if (isAction<DatabaseSelectedAction>(action, ActionTypes.DatabaseSelected)) {
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

  if (
    isAction<CollectionSelectedAction>(action, ActionTypes.CollectionSelected)
  ) {
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

const connectionInfoToStateConnections = (
  connectionInfo: ConnectionInfo
): State['connections'][number] => {
  return {
    id: connectionInfo.id,
    name: getConnectionTitle(connectionInfo),
    color: connectionInfo.favorite?.color,
  };
};

const loadDatabasesForConnection =
  (connectionId: string): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, _getState, { connections, instancesManager }) => {
    dispatch({ type: ActionTypes.LoadDatabases });
    try {
      const instance =
        instancesManager.getMongoDBInstanceForConnection(connectionId);
      const dataService = connections.getDataServiceForConnection(connectionId);

      await instance.fetchDatabases({ dataService });
      dispatch({
        type: ActionTypes.LoadDatabasesSuccess,
        databases: instance.databases.map((db) => db.name),
      });
    } catch {
      dispatch({ type: ActionTypes.LoadDatabasesError });
    }
  };

export const connectionSelected =
  (selectedConnection: string): SavedQueryAggregationThunkAction<void> =>
  (dispatch) => {
    dispatch({
      type: ActionTypes.ConnectionSelected,
      selectedConnection,
    });

    void dispatch(loadDatabasesForConnection(selectedConnection));
  };

export const connectionSelectedForPreSelectedNamespace = (
  selectedConnection: string
): ConnectionSelectedForPreSelectedNamespaceAction => ({
  type: ActionTypes.ConnectionSelectedForPreSelectedNamespace,
  selectedConnection,
});

export const updateItemNamespaceChecked = (updateItemNamespace: boolean) => ({
  type: ActionTypes.UpdateNamespaceChecked,
  updateItemNamespace,
});

const openNamespaceNotFoundModal =
  (
    selectedItem: Item,
    connections: State['connections'],
    selectedConnection?: string
  ): SavedQueryAggregationThunkAction<void, OpenModalAction> =>
  (dispatch) => {
    dispatch({
      type: ActionTypes.OpenModal,
      modal: 'namespace-not-found-modal',
      selectedItem,
      connections,
      selectedConnection,
    });

    if (selectedConnection) {
      void dispatch(loadDatabasesForConnection(selectedConnection));
    }
  };

const openSelectConnectionsModal = (
  selectedItem: Item,
  connections: State['connections'],
  selectedDatabase: string,
  selectedCollection: string
): OpenModalAction => ({
  type: ActionTypes.OpenModal,
  modal: 'select-connection-modal',
  selectedItem,
  connections,
  selectedDatabase,
  selectedCollection,
});

export const openSelectConnectionAndNamespaceModal =
  (
    id: string,
    activeConnections: ConnectionInfo[]
  ): SavedQueryAggregationThunkAction<void, OpenModalAction> =>
  (dispatch, getState) => {
    const {
      savedItems: { items },
    } = getState();

    if (!activeConnections.length) {
      dispatch(openNoActiveConnectionsModal());
      return;
    }

    const selectedItem = items.find((item) => item.id === id);

    if (!selectedItem) {
      return;
    }

    const connections = activeConnections.map(connectionInfoToStateConnections);
    const selectedConnection =
      connections.length === 1 ? connections[0].id : undefined;

    dispatch({
      type: ActionTypes.OpenModal,
      modal: 'select-connection-and-namespace-modal',
      selectedItem,
      connections,
      selectedConnection,
    });

    if (selectedConnection) {
      void dispatch(loadDatabasesForConnection(selectedConnection));
    }
  };

const openNoActiveConnectionsModal = (): OpenModalAction => ({
  type: ActionTypes.OpenModal,
  modal: 'no-active-connections-modal',
  connections: [],
});

export const closeModal = (): CloseModalAction => ({
  type: ActionTypes.CloseModal,
});

const openItem =
  (
    item: Item,
    connection: string,
    database: string,
    collection: string
  ): SavedQueryAggregationThunkAction<void> =>
  (_dispatch, _getState, { track, workspaces, connections }) => {
    const connectionInfo = connections.getConnectionById(connection)?.info;
    track(
      item.type === 'aggregation'
        ? 'Aggregation Opened'
        : 'Query History Favorite Used',
      {
        id: item.id,
        screen: 'my_queries',
      },
      connectionInfo
    );

    workspaces.openCollectionWorkspace(
      connection,
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
  (
    id: string,
    activeConnections: ConnectionInfo[]
  ): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (
    dispatch,
    getState,
    { instancesManager, connections, logger: { log, mongoLogId } }
  ) => {
    const {
      savedItems: { items },
    } = getState();

    if (!activeConnections.length) {
      dispatch(openNoActiveConnectionsModal());
      return;
    }

    const item = items.find((item) => item.id === id);

    if (!item) {
      return;
    }

    const { database, collection } = item;

    const connectionsWithError: { connectionId: string; error: Error }[] = [];
    const connectionsWithNamespace: ConnectionInfo[] = [];
    for (const connectionInfo of activeConnections) {
      try {
        const dataService = connections.getDataServiceForConnection(
          connectionInfo.id
        );
        const instance = instancesManager.getMongoDBInstanceForConnection(
          connectionInfo.id
        );
        const coll = await instance.getNamespace({
          dataService,
          database,
          collection,
        });

        if (coll) {
          connectionsWithNamespace.push(connectionInfo);
        }
      } catch (error) {
        connectionsWithError.push({
          connectionId: connectionInfo.id,
          error: error as Error,
        });
      }
    }

    if (connectionsWithError.length) {
      log.info(
        mongoLogId(1_001_000_316),
        'Saved Aggregations Queries',
        'Failed to lookup namespace in some connections',
        connectionsWithError
      );
    }

    if (connectionsWithNamespace.length === 0) {
      // If we only have one active connection then we have it selected by
      // default
      const selectedConnection =
        activeConnections.length === 1 ? activeConnections[0] : undefined;
      const connections = activeConnections.map(
        connectionInfoToStateConnections
      );
      dispatch(
        openNamespaceNotFoundModal(item, connections, selectedConnection?.id)
      );
    } else if (connectionsWithNamespace.length === 1) {
      dispatch(
        openItem(item, connectionsWithNamespace[0].id, database, collection)
      );
    } else {
      // For SelectConnectionsModal we only show the connections that have the namespace
      const connections = connectionsWithNamespace.map(
        connectionInfoToStateConnections
      );
      dispatch(
        openSelectConnectionsModal(item, connections, database, collection)
      );
    }
  };

export const openSelectedItem =
  (): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, getState, { queryStorage, pipelineStorage }) => {
    const {
      openItem: {
        selectedItem,
        selectedConnection,
        selectedDatabase,
        selectedCollection,
        updateItemNamespace,
      },
    } = getState();

    if (
      !selectedItem ||
      !selectedConnection ||
      !selectedDatabase ||
      !selectedCollection
    ) {
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
    dispatch(
      openItem(
        selectedItem,
        selectedConnection,
        selectedDatabase,
        selectedCollection
      )
    );
  };

export const databaseSelected =
  (database: string): SavedQueryAggregationThunkAction<Promise<void>> =>
  async (dispatch, getState, { instancesManager, connections }) => {
    const {
      openItem: { selectedDatabase, selectedConnection },
    } = getState();

    if (database === selectedDatabase) {
      return;
    }

    dispatch({ type: ActionTypes.DatabaseSelected, database });

    dispatch({ type: ActionTypes.LoadCollections });
    try {
      if (!selectedConnection) {
        throw new Error('Select a connection first');
      }

      const dataService =
        connections.getDataServiceForConnection(selectedConnection);
      const instance =
        instancesManager.getMongoDBInstanceForConnection(selectedConnection);

      const db = instance.databases.get(database);
      if (!db) {
        throw new Error('Database not found');
      }

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

export const collectionSelected: ActionCreator<CollectionSelectedAction> = (
  collection: string
) => {
  return { type: ActionTypes.CollectionSelected, collection };
};

export default reducer;
