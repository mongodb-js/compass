import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { startAnalysis } from './analysis-process';
import toNS from 'mongodb-ns';

export type GenerateDiagramWizardState = {
  // Overall progress of the wizard, kept separate from the step so that closing
  // the wizard can preserve the last step if needed
  inProgress: boolean;
  step:
    | 'ENTER_NAME'
    | 'SELECT_CONNECTION'
    | 'CONNECTING'
    | 'LOADING_DATABASES'
    | 'SELECT_DATABASE'
    | 'LOADING_COLLECTIONS'
    | 'SELECT_COLLECTIONS';
  diagramName: string;
  selectedConnectionId: string | null;
  connectionDatabases: string[] | null;
  selectedDatabase: string | null;
  databaseCollections: string[] | null;
  selectedCollections: string[] | null;
  automaticallyInferRelations: boolean;
  error: Error | null;
};

export enum GenerateDiagramWizardActionTypes {
  CREATE_NEW_DIAGRAM = 'data-modeling/generate-diagram-wizard/CREATE_NEW_DIAGRAM',
  CANCEL_CREATE_NEW_DIAGRAM = 'data-modeling/generate-diagram-wizard/CANCEL_CREATE_NEW_DIAGRAM',

  CHANGE_NAME = 'data-modeling/generate-diagram-wizard/CHANGE_NAME',
  CONFIRM_NAME = 'data-modeling/generate-diagram-wizard/CONFIRM_NAME',
  CANCEL_CONFIRM_NAME = 'data-modeling/generate-diagram-wizard/CANCEL_CONFIRM_NAME',

  SELECT_CONNECTION = 'data-modeling/generate-diagram-wizard/SELECT_CONNECTION',
  CONFIRM_SELECT_CONNECTION = 'data-modeling/generate-diagram-wizard/CONFIRM_SELECT_CONNECTION',
  CONNECTION_CONNECTED = 'data-modeling/generate-diagram-wizard/CONNECTION_CONNECTED',
  DATABASES_FETCHED = 'data-modeling/generate-diagram-wizard/DATABASES_FETCHED',
  CANCEL_SELECTED_CONNECTION = 'data-modeling/generate-diagram-wizard/CANCEL_SELECTED_CONNECTION',
  CONNECTION_FAILED = 'data-modeling/generate-diagram-wizard/CONNECTION_FAILED',

  SELECT_DATABASE = 'data-modeling/generate-diagram-wizard/SELECT_DATABASE',
  CONFIRM_SELECT_DATABASE = 'data-modeling/generate-diagram-wizard/CONFIRM_SELECT_DATABASE',
  COLLECTIONS_FETCHED = 'data-modeling/generate-diagram-wizard/COLLECTIONS_FETCHED',
  CANCEL_SELECTED_DATABASE = 'data-modeling/generate-diagram-wizard/CANCEL_SELECTED_DATABASE',
  COLLECTIONS_FETCH_FAILED = 'data-modeling/generate-diagram-wizard/COLLECTIONS_FETCH_FAILED',

  SELECT_COLLECTIONS = 'data-modeling/generate-diagram-wizard/SELECT_COLLECTIONS',
  TOGGLE_INFER_RELATIONS = 'data-modeling/generate-diagram-wizard/TOGGLE_INFER_RELATIONS',
  CONFIRM_SELECTED_COLLECTIONS = 'data-modeling/generate-diagram-wizard/CONFIRM_SELECTED_COLLECTIONS',
}

export type CreateNewDiagramAction = {
  type: GenerateDiagramWizardActionTypes.CREATE_NEW_DIAGRAM;
};

export type CancelCreateNewDiagramAction = {
  type: GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM;
};

export type ChangeNameAction = {
  type: GenerateDiagramWizardActionTypes.CHANGE_NAME;
  name: string;
};

export type ConfirmNameAction = {
  type: GenerateDiagramWizardActionTypes.CONFIRM_NAME;
};

export type CancelConfirmNameAction = {
  type: GenerateDiagramWizardActionTypes.CANCEL_CONFIRM_NAME;
};

export type SelectConnectionAction = {
  type: GenerateDiagramWizardActionTypes.SELECT_CONNECTION;
  id: string;
};

export type ConfirmSelectConnectionAction = {
  type: GenerateDiagramWizardActionTypes.CONFIRM_SELECT_CONNECTION;
};

export type CancelSelectedConnectionAction = {
  type: GenerateDiagramWizardActionTypes.CANCEL_SELECTED_CONNECTION;
};

export type ConnectionConnectedAction = {
  type: GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED;
};

export type DatabasesFetchedAction = {
  type: GenerateDiagramWizardActionTypes.DATABASES_FETCHED;
  connectionId: string;
  databases: string[];
};

export type ConnectionFailedAction = {
  type: GenerateDiagramWizardActionTypes.CONNECTION_FAILED;
  error: Error;
};

export type SelectDatabaseAction = {
  type: GenerateDiagramWizardActionTypes.SELECT_DATABASE;
  database: string;
};

export type ConfirmSelectDatabaseAction = {
  type: GenerateDiagramWizardActionTypes.CONFIRM_SELECT_DATABASE;
};

export type CancelSelectedDatabaseAction = {
  type: GenerateDiagramWizardActionTypes.CANCEL_SELECTED_DATABASE;
};

export type CollectionsFetchedAction = {
  type: GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED;
  connectionId: string;
  database: string;
  collections: string[];
};

export type CollectionsFetchFailedAction = {
  type: GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED;
  error: Error;
};

export type SelectCollectionsAction = {
  type: GenerateDiagramWizardActionTypes.SELECT_COLLECTIONS;
  collections: string[];
};

export type ToggleInferRelationsAction = {
  type: GenerateDiagramWizardActionTypes.TOGGLE_INFER_RELATIONS;
};

export type ConfirmSelectedCollectionsAction = {
  type: GenerateDiagramWizardActionTypes.CONFIRM_SELECTED_COLLECTIONS;
};

export type GenerateDiagramWizardActions =
  | CreateNewDiagramAction
  | CancelCreateNewDiagramAction
  | ChangeNameAction
  | SelectConnectionAction
  | ConfirmSelectConnectionAction
  | CancelSelectedConnectionAction
  | ConnectionConnectedAction
  | DatabasesFetchedAction
  | SelectDatabaseAction
  | ConfirmSelectDatabaseAction
  | CancelSelectedDatabaseAction
  | CollectionsFetchedAction
  | SelectCollectionsAction
  | ToggleInferRelationsAction
  | ConfirmSelectedCollectionsAction
  | CollectionsFetchFailedAction
  | ConnectionFailedAction;

const INITIAL_STATE: GenerateDiagramWizardState = {
  inProgress: false,
  step: 'ENTER_NAME',
  diagramName: '',
  selectedConnectionId: null,
  error: null,
  connectionDatabases: null,
  selectedDatabase: null,
  databaseCollections: null,
  selectedCollections: null,
  automaticallyInferRelations: true,
};

export const generateDiagramWizardReducer: Reducer<
  GenerateDiagramWizardState
> = (state = INITIAL_STATE, action) => {
  if (isAction(action, GenerateDiagramWizardActionTypes.CREATE_NEW_DIAGRAM)) {
    return { ...INITIAL_STATE, inProgress: true };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CHANGE_NAME)) {
    return {
      ...state,
      diagramName: action.name,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONFIRM_NAME)) {
    return {
      ...state,
      step: 'SELECT_CONNECTION',
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CANCEL_CONFIRM_NAME)) {
    return {
      ...state,
      error: null,
      step: 'ENTER_NAME',
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_CONNECTION)) {
    return {
      ...state,
      selectedConnectionId: action.id,
      error: null,
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.CONFIRM_SELECT_CONNECTION)
  ) {
    return {
      ...state,
      step: 'CONNECTING',
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED)) {
    return {
      ...state,
      step: 'LOADING_DATABASES',
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.DATABASES_FETCHED)) {
    if (action.connectionId !== state.selectedConnectionId) {
      return state;
    }
    return {
      ...state,
      step: 'SELECT_DATABASE',
      connectionDatabases: action.databases,
      selectedDatabase: null,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_DATABASE)) {
    return {
      ...state,
      selectedDatabase: action.database,
    };
  }
  if (
    isAction(
      action,
      GenerateDiagramWizardActionTypes.CANCEL_SELECTED_CONNECTION
    )
  ) {
    return { ...state, step: 'SELECT_CONNECTION', selectedConnectionId: null };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED)) {
    if (
      action.connectionId !== state.selectedConnectionId ||
      action.database !== state.selectedDatabase
    ) {
      return state;
    }
    return {
      ...state,
      step: 'SELECT_COLLECTIONS',
      databaseCollections: action.collections,
      // pre-select all collections by default
      selectedCollections: action.collections,
      automaticallyInferRelations: true,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_COLLECTIONS)) {
    return {
      ...state,
      selectedCollections: action.collections,
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.CANCEL_SELECTED_DATABASE)
  ) {
    return {
      ...state,
      step: 'SELECT_DATABASE',
      selectedDatabase: null,
    };
  }
  if (
    isAction(
      action,
      GenerateDiagramWizardActionTypes.CONFIRM_SELECTED_COLLECTIONS
    )
  ) {
    return {
      ...state,
      inProgress: false,
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM)
  ) {
    return {
      ...state,
      inProgress: false,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONNECTION_FAILED)) {
    return {
      ...state,
      error: action.error,
      step: 'SELECT_CONNECTION',
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED)
  ) {
    return {
      ...state,
      error: action.error,
      step: 'SELECT_DATABASE',
    };
  }
  return state;
};

export function createNewDiagram(): CreateNewDiagramAction {
  return { type: GenerateDiagramWizardActionTypes.CREATE_NEW_DIAGRAM };
}

export function changeName(name: string): ChangeNameAction {
  return { type: GenerateDiagramWizardActionTypes.CHANGE_NAME, name };
}

export function confirmName(): ConfirmNameAction {
  return { type: GenerateDiagramWizardActionTypes.CONFIRM_NAME };
}

export function selectConnection(connectionId: string): SelectConnectionAction {
  return {
    type: GenerateDiagramWizardActionTypes.SELECT_CONNECTION,
    id: connectionId,
  };
}

export function confirmSelectConnection(): DataModelingThunkAction<
  Promise<void>,
  | ConfirmSelectConnectionAction
  | ConnectionConnectedAction
  | DatabasesFetchedAction
  | ConnectionFailedAction
> {
  return async (dispatch, getState, services) => {
    dispatch({
      type: GenerateDiagramWizardActionTypes.CONFIRM_SELECT_CONNECTION,
    });
    try {
      const { selectedConnectionId } = getState().generateDiagramWizard;
      if (!selectedConnectionId) {
        return;
      }
      const connectionInfo =
        services.connections.getConnectionById(selectedConnectionId)?.info;
      if (!connectionInfo) {
        return;
      }
      await services.connections.connect(connectionInfo);
      // ConnectionsService.connect does not throw an error if it fails to establish a connection,
      // so explicitly checking if error is in the connection item and throwing it.
      const connectionError =
        services.connections.getConnectionById(selectedConnectionId)?.error;
      if (connectionError) {
        throw connectionError;
      }
      dispatch({ type: GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED });
      const mongoDBInstance =
        services.instanceManager.getMongoDBInstanceForConnection(
          selectedConnectionId
        );
      const dataService =
        services.connections.getDataServiceForConnection(selectedConnectionId);
      await mongoDBInstance.fetchDatabases({ dataService });
      dispatch({
        type: GenerateDiagramWizardActionTypes.DATABASES_FETCHED,
        connectionId: selectedConnectionId,
        databases: mongoDBInstance.databases
          .map((db) => {
            return db.name;
          })
          .filter((dbName) => {
            return !toNS(dbName).specialish;
          }),
      });
    } catch (err) {
      services.logger.log.error(
        services.logger.mongoLogId(1_001_000_348),
        'DataModeling',
        'Failed to select connection',
        { err }
      );
      dispatch({
        type: GenerateDiagramWizardActionTypes.CONNECTION_FAILED,
        error: err as Error,
      });
    }
  };
}

export function selectDatabase(database: string): SelectDatabaseAction {
  return {
    type: GenerateDiagramWizardActionTypes.SELECT_DATABASE,
    database,
  };
}

export function confirmSelectDatabase(): DataModelingThunkAction<
  Promise<void>,
  | ConfirmSelectDatabaseAction
  | CollectionsFetchedAction
  | CollectionsFetchFailedAction
> {
  return async (dispatch, getState, services) => {
    dispatch({
      type: GenerateDiagramWizardActionTypes.CONFIRM_SELECT_DATABASE,
    });
    try {
      const { selectedConnectionId, selectedDatabase } =
        getState().generateDiagramWizard;
      if (!selectedConnectionId || !selectedDatabase) {
        return;
      }
      const mongoDBInstance =
        services.instanceManager.getMongoDBInstanceForConnection(
          selectedConnectionId
        );
      const dataService =
        services.connections.getDataServiceForConnection(selectedConnectionId);
      const db = mongoDBInstance.databases.get(selectedDatabase);
      if (!db) {
        return;
      }
      await db.fetchCollections({ dataService });
      dispatch({
        type: GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED,
        connectionId: selectedConnectionId,
        database: selectedDatabase,
        collections: db.collections
          .map((coll) => {
            return coll.name;
          })
          .filter((collName) => {
            return !toNS(collName).specialish;
          }),
      });
    } catch (err) {
      services.logger.log.error(
        services.logger.mongoLogId(1_001_000_349),
        'DataModeling',
        'Failed to select database',
        { err }
      );
      dispatch({
        type: GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED,
        error: err as Error,
      });
    }
  };
}

export function selectCollections(
  collections: string[]
): SelectCollectionsAction {
  return {
    type: GenerateDiagramWizardActionTypes.SELECT_COLLECTIONS,
    collections,
  };
}

export function confirmSelectedCollections(): DataModelingThunkAction<
  void,
  ConfirmSelectedCollectionsAction
> {
  return (dispatch, getState) => {
    const {
      diagramName,
      selectedConnectionId,
      selectedDatabase,
      selectedCollections,
      automaticallyInferRelations,
    } = getState().generateDiagramWizard;
    if (!selectedConnectionId || !selectedDatabase || !selectedCollections) {
      return;
    }
    dispatch({
      type: GenerateDiagramWizardActionTypes.CONFIRM_SELECTED_COLLECTIONS,
    });
    void dispatch(
      startAnalysis(
        diagramName,
        selectedConnectionId,
        selectedDatabase,
        selectedCollections,
        { automaticallyInferRelations }
      )
    );
  };
}

export function cancelCreateNewDiagram(): CancelCreateNewDiagramAction {
  return { type: GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM };
}

export function cancelConfirmName(): CancelConfirmNameAction {
  return { type: GenerateDiagramWizardActionTypes.CANCEL_CONFIRM_NAME };
}

export function cancelSelectedConnection(): CancelSelectedConnectionAction {
  return { type: GenerateDiagramWizardActionTypes.CANCEL_SELECTED_CONNECTION };
}

export function cancelSelectedDatabase(): CancelSelectedDatabaseAction {
  return { type: GenerateDiagramWizardActionTypes.CANCEL_SELECTED_DATABASE };
}
