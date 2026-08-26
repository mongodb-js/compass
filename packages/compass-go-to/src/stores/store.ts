import type { Action, AnyAction } from 'redux';
import { applyMiddleware, createStore } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import thunk from 'redux-thunk';
import type { ActivateHelpers } from '@mongodb-js/compass-app-registry';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import { MongoDBInstancesManagerEvents } from '@mongodb-js/compass-app-stores/provider';
import type { workspacesServiceLocator } from '@mongodb-js/compass-workspaces/provider';
import type { MongoDBInstance } from 'mongodb-instance-model';
import {
  buildGoToCandidates,
  type GoToCandidate,
  type GoToConnectionStatus,
} from '../go-to-candidates';
import { activateGoToCandidate } from '../go-to-activate';

export type GoToServices = {
  connections: ConnectionsService;
  instancesManager: MongoDBInstancesManager;
  workspaces: ReturnType<typeof workspacesServiceLocator>;
};

export type GoToState = {
  candidates: GoToCandidate[];
};

const INITIAL_STATE: GoToState = {
  candidates: [],
};

export const GoToActions = {
  CandidatesRefreshed: 'compass-go-to/candidates-refreshed',
} as const;

type CandidatesRefreshedAction = {
  type: (typeof GoToActions)['CandidatesRefreshed'];
  candidates: GoToCandidate[];
};

type GoToAction = CandidatesRefreshedAction;

function reducer(
  state: GoToState = INITIAL_STATE,
  action: AnyAction
): GoToState {
  if (action.type === GoToActions.CandidatesRefreshed) {
    return {
      ...state,
      candidates: (action as CandidatesRefreshedAction).candidates,
    };
  }
  return state;
}

export type GoToRootState = GoToState;

export type GoToThunkAction<R, A extends Action = GoToAction> = ThunkAction<
  R,
  GoToRootState,
  GoToServices,
  A
>;

function readCandidates(services: GoToServices): GoToCandidate[] {
  const instancesByConnectionId = new Map(
    Array.from(services.instancesManager.listMongoDBInstances().entries()).map(
      ([connectionId, instance]) => [
        connectionId,
        {
          databases: instance.databases.map((database) => ({
            name: database.name,
            collections: database.collections.map((collection) => ({
              name: collection.name,
              type: collection.type,
            })),
          })),
        },
      ]
    )
  );

  const connections = services.connections.current.map((connection) => {
    const hasInstance = instancesByConnectionId.has(connection.info.id);
    // Instance presence is the reliable signal: the connections service emits
    // `connected` before status flips to `connected`.
    const status: GoToConnectionStatus =
      connection.status === 'connected' || hasInstance
        ? 'connected'
        : connection.status;
    return {
      id: connection.info.id,
      title: connection.title,
      status,
    };
  });

  return buildGoToCandidates(connections, instancesByConnectionId);
}

export const refreshCandidates =
  (): GoToThunkAction<void> => (dispatch, _getState, services) => {
    dispatch({
      type: GoToActions.CandidatesRefreshed,
      candidates: readCandidates(services),
    });
  };

export const loadInventory =
  (): GoToThunkAction<Promise<void>> =>
  async (dispatch, _getState, services) => {
    const { connections, instancesManager } = services;

    // Immediate refresh with live connection list + whatever inventory is
    // already loaded (e.g. via sidebar), so typing works before fetches finish.
    dispatch(refreshCandidates());

    const connectedIds = new Set([
      ...instancesManager.listMongoDBInstances().keys(),
      ...connections.current
        .filter((connection) => connection.status === 'connected')
        .map((connection) => connection.info.id),
    ]);

    await Promise.all(
      Array.from(connectedIds).map(async (connectionId) => {
        try {
          const instance =
            instancesManager.getMongoDBInstanceForConnection(connectionId);
          const dataService =
            connections.getDataServiceForConnection(connectionId);
          await instance.fetchDatabases({ dataService });
          await Promise.all(
            instance.databases.map((database) =>
              database.fetchCollections({ dataService })
            )
          );
        } catch {
          // Best-effort: still refresh below with whatever is already loaded.
        }
      })
    );

    dispatch(refreshCandidates());
  };

export type ActivateGoToResult = {
  close: boolean;
  error?: string;
};

export const activateResult =
  (candidate: GoToCandidate): GoToThunkAction<Promise<ActivateGoToResult>> =>
  async (_dispatch, _getState, { connections, workspaces }) => {
    if (candidate.connected) {
      return {
        close: activateGoToCandidate(candidate, workspaces),
      };
    }

    if (candidate.kind !== 'connection') {
      return { close: false };
    }

    const connection = connections.getConnectionById(candidate.connectionId);
    if (!connection) {
      return { close: false, error: 'Connection not found.' };
    }

    await connections.connect(connection.info);

    // ConnectionsService.connect does not throw on failure; check the stored
    // connection error the same way other features do after await.
    const connectionError = connections.getConnectionById(
      candidate.connectionId
    )?.error;
    if (connectionError) {
      return {
        close: false,
        error: connectionError.message || 'Failed to connect.',
      };
    }

    return {
      close: activateGoToCandidate(
        { ...candidate, connected: true },
        workspaces
      ),
    };
  };

function configureStore(services: GoToServices) {
  return createStore(
    reducer,
    INITIAL_STATE,
    applyMiddleware(thunk.withExtraArgument(services))
  );
}

export function activatePlugin(
  _props: unknown,
  services: GoToServices,
  { on, cleanup }: ActivateHelpers
) {
  const store = configureStore(services);
  const { instancesManager } = services;

  const refresh = () => {
    store.dispatch(refreshCandidates());
  };

  const setupInstanceListeners = (
    _connectionId: string,
    instance: MongoDBInstance
  ) => {
    on(instance, 'change:databasesStatus', refresh);
    on(instance, 'add:databases', refresh);
    on(instance, 'remove:databases', refresh);
    on(instance, 'change:collectionsStatus', refresh);
    on(instance, 'add:collections', refresh);
    on(instance, 'remove:collections', refresh);
    refresh();
  };

  for (const [
    connectionId,
    instance,
  ] of instancesManager.listMongoDBInstances()) {
    setupInstanceListeners(connectionId, instance);
  }

  on(
    instancesManager,
    MongoDBInstancesManagerEvents.InstanceCreated,
    setupInstanceListeners
  );
  on(instancesManager, MongoDBInstancesManagerEvents.InstanceRemoved, refresh);

  refresh();

  return { store, deactivate: cleanup };
}
