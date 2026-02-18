import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import toNS from 'mongodb-ns';
import { selectCurrentModelFromState } from './diagram';
import type { MongoDBInstancesManager } from '@mongodb-js/compass-app-stores/provider';
import type { ConnectionsService } from '@mongodb-js/compass-connections/provider';
import { redoAnalysis } from './analysis-process';

const DEFAULT_SAMPLE_SIZE = 100;

export type ReselectCollectionsWizardState = {
  isOpen: boolean;
  step: 'SELECT_CONNECTION' | 'SELECT_COLLECTIONS';
  diagramName: string;
  selectedConnectionId?: string;
  selectedDatabase?: string;
  databaseCollections: string[];
  selectedCollections: string[];
  newSelectedCollections: string[];
  automaticallyInferRelations: boolean;
  sampleSize: number;
  isConnecting: boolean;
  error?: Error;
};

export const ReselectCollectionsWizardActionTypes = {
  SHOW_WIZARD: 'data-modeling/reselect-collections-wizard/SHOW_WIZARD',
  HIDE_WIZARD: 'data-modeling/reselect-collections-wizard/HIDE_WIZARD',
  CONNECTION_SELECTED:
    'data-modeling/reselect-collections-wizard/CONNECTION_SELECTED',
  CONNECT_TO_CONNECTION_CLICKED:
    'data-modeling/reselect-collections-wizard/CONNECT_TO_CONNECTION_CLICKED',
  CONNECT_TO_CONNECTION_SUCCEEDED:
    'data-modeling/reselect-collections-wizard/CONNECT_TO_CONNECTION_SUCCEEDED',
  CONNECT_TO_CONNECTION_FAILED:
    'data-modeling/reselect-collections-wizard/CONNECT_TO_CONNECTION_FAILED',
  TOGGLE_INFER_RELATION_CLICKED:
    'data-modeling/reselect-collections-wizard/TOGGLE_INFER_RELATION_CLICKED',
  CHANGE_SAMPLE_SIZE_CLICKED:
    'data-modeling/reselect-collections-wizard/CHANGE_SAMPLE_SIZE_CLICKED',
  SELECT_COLLECTIONS_CLICKED:
    'data-modeling/reselect-collections-wizard/SELECT_COLLECTIONS_CLICKED',
  START_ANALYSIS: 'data-modeling/reselect-collections-wizard/START_ANALYSIS',
} as const;

export type ShowReselectCollectionWizardAction = {
  type: typeof ReselectCollectionsWizardActionTypes.SHOW_WIZARD;
  step: ReselectCollectionsWizardState['step'];
  diagramName: string;
  selectedConnectionId?: string;
  selectedDatabase: string;
  selectedCollections: string[];
  databaseCollections: string[];
  error?: Error;
};

export type HideReselectCollectionWizardAction = {
  type: typeof ReselectCollectionsWizardActionTypes.HIDE_WIZARD;
};

export type ConnectionSelectedAction = {
  type: typeof ReselectCollectionsWizardActionTypes.CONNECTION_SELECTED;
  connectionId: string;
};

export type ConnectToConnectionClickedAction = {
  type: typeof ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_CLICKED;
};
export type ConnectToConnectionFailedAction = {
  type: typeof ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_FAILED;
  error: Error;
};
export type ConnectToConnectionSucceededAction = {
  type: typeof ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_SUCCEEDED;
  collections: string[];
};

export type ToggleInferRelationsAction = {
  type: typeof ReselectCollectionsWizardActionTypes.TOGGLE_INFER_RELATION_CLICKED;
  val: boolean;
};

export type ReselectCollectionsChangeSampleSizeAction = {
  type: typeof ReselectCollectionsWizardActionTypes.CHANGE_SAMPLE_SIZE_CLICKED;
  sampleSize: number;
};

export type SelectCollectionsAction = {
  type: typeof ReselectCollectionsWizardActionTypes.SELECT_COLLECTIONS_CLICKED;
  collections: string[];
};

export type StartAnalysisAction = {
  type: typeof ReselectCollectionsWizardActionTypes.START_ANALYSIS;
};

export type ReselectCollectionsWizardActions =
  | ShowReselectCollectionWizardAction
  | HideReselectCollectionWizardAction
  | ConnectionSelectedAction
  | ConnectToConnectionClickedAction
  | ConnectToConnectionFailedAction
  | ConnectToConnectionSucceededAction
  | ToggleInferRelationsAction
  | ReselectCollectionsChangeSampleSizeAction
  | SelectCollectionsAction
  | StartAnalysisAction;

const INITIAL_STATE: ReselectCollectionsWizardState = {
  isOpen: false,
  step: 'SELECT_CONNECTION',
  diagramName: '',
  selectedCollections: [],
  newSelectedCollections: [],
  automaticallyInferRelations: true,
  sampleSize: DEFAULT_SAMPLE_SIZE,
  isConnecting: false,
  databaseCollections: [],
};

export const reselectCollectionsWizardReducer: Reducer<
  ReselectCollectionsWizardState
> = (state = INITIAL_STATE, action) => {
  if (isAction(action, ReselectCollectionsWizardActionTypes.SHOW_WIZARD)) {
    const { type, ...restOfAction } = action;
    return {
      ...state,
      ...restOfAction,
      isOpen: true,
    };
  }

  if (isAction(action, ReselectCollectionsWizardActionTypes.HIDE_WIZARD)) {
    return { ...INITIAL_STATE, isOpen: false };
  }

  if (
    isAction(action, ReselectCollectionsWizardActionTypes.CONNECTION_SELECTED)
  ) {
    return {
      ...state,
      selectedConnectionId: action.connectionId,
      error: undefined,
      isConnecting: false,
    };
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_CLICKED
    )
  ) {
    return { ...state, isConnecting: true };
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_FAILED
    )
  ) {
    return { ...state, isConnecting: false, error: action.error };
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_SUCCEEDED
    )
  ) {
    return {
      ...state,
      isConnecting: false,
      error: undefined,
      databaseCollections: action.collections,
      step: 'SELECT_COLLECTIONS',
    };
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.TOGGLE_INFER_RELATION_CLICKED
    )
  ) {
    return { ...state, automaticallyInferRelations: action.val };
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.SELECT_COLLECTIONS_CLICKED
    )
  ) {
    return { ...state, newSelectedCollections: action.collections };
  }

  if (isAction(action, ReselectCollectionsWizardActionTypes.START_ANALYSIS)) {
    return INITIAL_STATE;
  }

  if (
    isAction(
      action,
      ReselectCollectionsWizardActionTypes.CHANGE_SAMPLE_SIZE_CLICKED
    )
  ) {
    return { ...state, sampleSize: action.sampleSize };
  }

  return state;
};

export function hideReselectCollections() {
  return {
    type: ReselectCollectionsWizardActionTypes.HIDE_WIZARD,
  };
}

export function reselectCollections(): DataModelingThunkAction<
  Promise<void>,
  ShowReselectCollectionWizardAction
> {
  return async (
    dispatch,
    getState,
    { connections, instanceManager, logger, track }
  ) => {
    const { diagram } = getState();
    if (!diagram) {
      return;
    }

    const diagramName = diagram.name;
    const selectedConnection = diagram.connectionId || undefined;
    const selectedDatabase = diagram.database;
    const model = selectCurrentModelFromState(getState());
    const selectedCollections = model.collections.map(
      (c) => toNS(c.ns).collection
    );

    track('Data Modeling Add DB Collections Modal Opened', {});

    try {
      const connection = connections.getConnectionById(
        selectedConnection || ''
      );
      if (
        !selectedConnection ||
        !connection ||
        connection.status !== 'connected'
      ) {
        dispatch({
          type: ReselectCollectionsWizardActionTypes.SHOW_WIZARD,
          step: 'SELECT_CONNECTION',
          diagramName,
          selectedConnectionId: selectedConnection,
          selectedDatabase: selectedDatabase,
          selectedCollections,
          databaseCollections: [],
        });
        return;
      }

      // We want to fetch the collections of the selected database
      const databases = await getDatabasesFromConnection(
        selectedConnection,
        connections,
        instanceManager
      );
      if (!databases.some((x) => x === selectedDatabase)) {
        throw new Error(
          'The selected database does not exist on this connection.'
        );
      }
      const databaseCollections = await getCollectionsForDatabase(
        selectedConnection,
        selectedDatabase,
        connections,
        instanceManager
      );
      dispatch({
        type: ReselectCollectionsWizardActionTypes.SHOW_WIZARD,
        step: 'SELECT_COLLECTIONS',
        diagramName,
        selectedConnectionId: selectedConnection,
        selectedDatabase: selectedDatabase,
        selectedCollections,
        databaseCollections,
      });
    } catch (err) {
      logger.log.error(
        logger.mongoLogId(1_001_000_387),
        'DataModeling',
        'Failed to find the database',
        { err }
      );
      dispatch({
        type: ReselectCollectionsWizardActionTypes.SHOW_WIZARD,
        step: 'SELECT_CONNECTION',
        diagramName,
        selectedConnectionId: selectedConnection,
        selectedDatabase: selectedDatabase,
        selectedCollections,
        databaseCollections: [],
        error: err as Error,
      });
    }
  };
}

export function selectConnection(connectionId: string) {
  return {
    type: ReselectCollectionsWizardActionTypes.CONNECTION_SELECTED,
    connectionId,
  };
}

export function establishConnection(): DataModelingThunkAction<
  Promise<void>,
  | ConnectToConnectionClickedAction
  | ConnectToConnectionSucceededAction
  | ConnectToConnectionFailedAction
> {
  return async (
    dispatch,
    getState,
    { connections, instanceManager, logger }
  ) => {
    const {
      reselectCollections: { selectedConnectionId, selectedDatabase },
    } = getState();
    if (!selectedConnectionId || !selectedDatabase) {
      return;
    }
    try {
      const connectionInfo = connections.getConnectionById(
        selectedConnectionId ?? ''
      )?.info;
      if (!connectionInfo) {
        throw new Error('Can not find selected connection.');
      }
      dispatch({
        type: ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_CLICKED,
      });
      await connections.connect(connectionInfo);
      // ConnectionsService.connect does not throw an error if it fails to establish a connection,
      // so explicitly checking if error is in the connection item and throwing it.
      const connectionError = connections.getConnectionById(
        selectedConnectionId ?? ''
      )?.error;
      if (connectionError) {
        throw connectionError;
      }
      // Now fetch the collections
      const databaseCollections = await getCollectionsForDatabase(
        selectedConnectionId,
        selectedDatabase,
        connections,
        instanceManager
      );
      dispatch({
        type: ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_SUCCEEDED,
        collections: databaseCollections,
      });
    } catch (err) {
      logger.log.error(
        logger.mongoLogId(1_001_000_392),
        'DataModeling',
        'Failed to connect',
        { err }
      );
      dispatch({
        type: ReselectCollectionsWizardActionTypes.CONNECT_TO_CONNECTION_FAILED,
        error: err as Error,
      });
      return;
    }
  };
}

export function toggleInferRelationships(
  val: boolean
): ToggleInferRelationsAction {
  return {
    type: ReselectCollectionsWizardActionTypes.TOGGLE_INFER_RELATION_CLICKED,
    val,
  };
}

export function selectCollections(
  collections: string[]
): SelectCollectionsAction {
  return {
    type: ReselectCollectionsWizardActionTypes.SELECT_COLLECTIONS_CLICKED,
    collections,
  };
}

export function startRedoAnalysis(): DataModelingThunkAction<
  void,
  StartAnalysisAction
> {
  return (dispatch, getState) => {
    const {
      reselectCollections: {
        diagramName,
        selectedConnectionId,
        selectedDatabase,
        newSelectedCollections,
        selectedCollections,
        automaticallyInferRelations,
        sampleSize,
      },
      diagram,
    } = getState();
    if (!diagram) {
      throw new Error('Can not start analysis when there is no diagram');
    }
    if (!selectedConnectionId || !selectedDatabase) {
      throw new Error(
        'Can not start analysis when connection or database is not selected'
      );
    }
    dispatch({
      type: ReselectCollectionsWizardActionTypes.START_ANALYSIS,
    });
    void dispatch(
      redoAnalysis(
        diagramName,
        selectedConnectionId,
        selectedDatabase,
        [...newSelectedCollections, ...selectedCollections],
        {
          automaticallyInferRelations,
          sampleSize,
        }
      )
    );
  };
}
async function getDatabasesFromConnection(
  connectionId: string,
  connections: ConnectionsService,
  instanceManager: MongoDBInstancesManager
) {
  const mongoDBInstance =
    instanceManager.getMongoDBInstanceForConnection(connectionId);
  const dataService = connections.getDataServiceForConnection(connectionId);
  await mongoDBInstance.fetchDatabases({ dataService });

  return mongoDBInstance.databases
    .map((db) => {
      return db.name;
    })
    .filter((dbName) => {
      return !toNS(dbName).specialish;
    });
}

async function getCollectionsForDatabase(
  connectionId: string,
  database: string,
  connections: ConnectionsService,
  instanceManager: MongoDBInstancesManager
) {
  await getDatabasesFromConnection(connectionId, connections, instanceManager);
  const mongoDBInstance =
    instanceManager.getMongoDBInstanceForConnection(connectionId);
  const dataService = connections.getDataServiceForConnection(connectionId);
  const db = mongoDBInstance.databases.get(database);
  if (!db) {
    throw new Error('The selected database does not exist on this connection.');
  }
  await db.fetchCollections({ dataService, force: true });
  return db.collections
    .map((coll) => {
      return coll.name;
    })
    .filter((collName) => {
      return !toNS(collName).specialish;
    });
}

export function changeSampleSize(
  sampleSize: number
): ReselectCollectionsChangeSampleSizeAction {
  return {
    type: ReselectCollectionsWizardActionTypes.CHANGE_SAMPLE_SIZE_CLICKED,
    sampleSize,
  };
}
