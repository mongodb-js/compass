import type { Reducer } from 'redux';
import { isAction } from './util';
import type { DataModelingThunkAction } from './reducer';
import { startAnalysis } from './analysis-process';
import toNS from 'mongodb-ns';

type FormField<T = string> = {
  error?: Error;
  value?: T;
};

export type GenerateDiagramWizardState = {
  // Overall progress of the wizard, kept separate from the step so that closing
  // the wizard can preserve the last step if needed
  inProgress: boolean;
  step: 'SETUP_DIAGRAM' | 'SELECT_COLLECTIONS';
  formFields: {
    diagramName: FormField;
    selectedConnectionId: FormField & { isConnecting?: boolean };
    selectedDatabase: FormField & { isFetchingDatabases?: boolean };
    selectedCollections: FormField<string[]> & {
      isFetchingCollections?: boolean;
    };
  };
  connectionDatabases: string[] | null;
  databaseCollections: string[] | null;
  automaticallyInferRelations: boolean;
};

export const GenerateDiagramWizardActionTypes = {
  GOTO_STEP: 'data-modeling/generate-diagram-wizard/GOTO_STEP',
  CREATE_NEW_DIAGRAM:
    'data-modeling/generate-diagram-wizard/CREATE_NEW_DIAGRAM',
  CANCEL_CREATE_NEW_DIAGRAM:
    'data-modeling/generate-diagram-wizard/CANCEL_CREATE_NEW_DIAGRAM',

  CHANGE_NAME: 'data-modeling/generate-diagram-wizard/CHANGE_NAME',

  SELECT_CONNECTION: 'data-modeling/generate-diagram-wizard/SELECT_CONNECTION',
  CONNECTION_CONNECTED:
    'data-modeling/generate-diagram-wizard/CONNECTION_CONNECTED',
  DATABASES_FETCHED: 'data-modeling/generate-diagram-wizard/DATABASES_FETCHED',
  CONNECTION_FAILED: 'data-modeling/generate-diagram-wizard/CONNECTION_FAILED',

  SELECT_DATABASE: 'data-modeling/generate-diagram-wizard/SELECT_DATABASE',
  DATABASES_FETCH_FAILED:
    'data-modeling/generate-diagram-wizard/DATABASES_FETCH_FAILED',
  COLLECTIONS_FETCHED:
    'data-modeling/generate-diagram-wizard/COLLECTIONS_FETCHED',
  COLLECTIONS_FETCH_FAILED:
    'data-modeling/generate-diagram-wizard/COLLECTIONS_FETCH_FAILED',

  SELECT_COLLECTIONS:
    'data-modeling/generate-diagram-wizard/SELECT_COLLECTIONS',
  TOGGLE_INFER_RELATIONS:
    'data-modeling/generate-diagram-wizard/TOGGLE_INFER_RELATIONS',
  CONFIRM_SELECTED_COLLECTIONS:
    'data-modeling/generate-diagram-wizard/CONFIRM_SELECTED_COLLECTIONS',
} as const;

export type GotoStepAction = {
  type: typeof GenerateDiagramWizardActionTypes.GOTO_STEP;
  step: GenerateDiagramWizardState['step'];
};

export type CreateNewDiagramAction = {
  type: typeof GenerateDiagramWizardActionTypes.CREATE_NEW_DIAGRAM;
};

export type CancelCreateNewDiagramAction = {
  type: typeof GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM;
};

export type ChangeNameAction = {
  type: typeof GenerateDiagramWizardActionTypes.CHANGE_NAME;
  name: string;
  error?: Error;
};

export type SelectConnectionAction = {
  type: typeof GenerateDiagramWizardActionTypes.SELECT_CONNECTION;
  id: string;
};
export type ConnectionConnectedAction = {
  type: typeof GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED;
};

export type DatabasesFetchedAction = {
  type: typeof GenerateDiagramWizardActionTypes.DATABASES_FETCHED;
  connectionId: string;
  databases: string[];
};

export type ConnectionFailedAction = {
  type: typeof GenerateDiagramWizardActionTypes.CONNECTION_FAILED;
  error: Error;
};

export type SelectDatabaseAction = {
  type: typeof GenerateDiagramWizardActionTypes.SELECT_DATABASE;
  database: string;
};

export type DatabasesFetchFailedAction = {
  type: typeof GenerateDiagramWizardActionTypes.DATABASES_FETCH_FAILED;
  error: Error;
};

export type CollectionsFetchedAction = {
  type: typeof GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED;
  connectionId: string;
  database: string;
  collections: string[];
};

export type CollectionsFetchFailedAction = {
  type: typeof GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED;
  error: Error;
};

export type SelectCollectionsAction = {
  type: typeof GenerateDiagramWizardActionTypes.SELECT_COLLECTIONS;
  collections: string[];
};

export type ToggleInferRelationsAction = {
  type: typeof GenerateDiagramWizardActionTypes.TOGGLE_INFER_RELATIONS;
  newVal: boolean;
};

export type ConfirmSelectedCollectionsAction = {
  type: typeof GenerateDiagramWizardActionTypes.CONFIRM_SELECTED_COLLECTIONS;
};

export type GenerateDiagramWizardActions =
  | GotoStepAction
  | CreateNewDiagramAction
  | CancelCreateNewDiagramAction
  | ChangeNameAction
  | SelectConnectionAction
  | ConnectionConnectedAction
  | DatabasesFetchedAction
  | SelectDatabaseAction
  | DatabasesFetchFailedAction
  | CollectionsFetchedAction
  | SelectCollectionsAction
  | ToggleInferRelationsAction
  | ConfirmSelectedCollectionsAction
  | CollectionsFetchFailedAction
  | ConnectionFailedAction;

const INITIAL_STATE: GenerateDiagramWizardState = {
  inProgress: false,
  step: 'SETUP_DIAGRAM',
  formFields: {
    diagramName: {},
    selectedConnectionId: {},
    selectedDatabase: {},
    selectedCollections: {},
  },
  connectionDatabases: null,
  databaseCollections: null,
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
      formFields: {
        ...state.formFields,
        diagramName: {
          value: action.name,
          error: action.error,
        },
      },
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_CONNECTION)) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedConnectionId: {
          isConnecting: true,
          value: action.id,
        },
        selectedDatabase: {},
      },
      connectionDatabases: [],
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED)) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedConnectionId: {
          ...state.formFields.selectedConnectionId,
          isConnecting: false,
          error: undefined,
        },
        selectedDatabase: {
          isFetchingDatabases: true,
        },
      },
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.CONNECTION_FAILED)) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedConnectionId: {
          ...state.formFields.selectedConnectionId,
          isConnecting: false,
          error: action.error,
        },
      },
    };
  }

  if (isAction(action, GenerateDiagramWizardActionTypes.DATABASES_FETCHED)) {
    if (action.connectionId !== state.formFields.selectedConnectionId.value) {
      return state;
    }
    return {
      ...state,
      connectionDatabases: action.databases,
      formFields: {
        ...state.formFields,
        selectedDatabase: {
          isFetchingDatabases: false,
        },
      },
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.DATABASES_FETCH_FAILED)
  ) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedDatabase: {
          isFetchingDatabases: false,
          error: action.error,
        },
      },
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_DATABASE)) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedDatabase: {
          value: action.database,
        },
      },
    };
  }

  if (isAction(action, GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED)) {
    if (
      action.connectionId !== state.formFields.selectedConnectionId.value ||
      action.database !== state.formFields.selectedDatabase.value
    ) {
      return state;
    }
    return {
      ...state,
      databaseCollections: action.collections,
      // pre-select all collections by default
      formFields: {
        ...state.formFields,
        selectedCollections: {
          value: action.collections,
        },
      },
      automaticallyInferRelations: true,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.SELECT_COLLECTIONS)) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedCollections: {
          value: action.collections,
        },
      },
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

  if (
    isAction(action, GenerateDiagramWizardActionTypes.COLLECTIONS_FETCH_FAILED)
  ) {
    return {
      ...state,
      formFields: {
        ...state.formFields,
        selectedCollections: {
          isFetchingCollections: false,
          error: action.error,
        },
      },
    };
  }
  if (
    isAction(action, GenerateDiagramWizardActionTypes.TOGGLE_INFER_RELATIONS)
  ) {
    return {
      ...state,
      automaticallyInferRelations: action.newVal,
    };
  }
  if (isAction(action, GenerateDiagramWizardActionTypes.GOTO_STEP)) {
    return {
      ...state,
      step: action.step,
    };
  }
  return state;
};

export function gotoStep(
  step: GenerateDiagramWizardState['step']
): DataModelingThunkAction<void, GotoStepAction> {
  return (dispatch, getState) => {
    const currentStep = getState().generateDiagramWizard.step;
    if (currentStep === step) {
      return;
    }
    dispatch({
      type: GenerateDiagramWizardActionTypes.GOTO_STEP,
      step,
    });
  };
}

export function createNewDiagram(): CreateNewDiagramAction {
  return { type: GenerateDiagramWizardActionTypes.CREATE_NEW_DIAGRAM };
}

export function changeName(
  name: string
): DataModelingThunkAction<Promise<void>, ChangeNameAction> {
  return async (dispatch, getState, { dataModelStorage }) => {
    const items = await dataModelStorage.loadAll();
    const nameExists = items.find((x) => x.name === name);
    dispatch({
      type: GenerateDiagramWizardActionTypes.CHANGE_NAME,
      name,
      error: nameExists
        ? new Error('Diagram with this name already exists')
        : undefined,
    });
  };
}

export function selectConnection(
  connectionId: string
): DataModelingThunkAction<
  Promise<void>,
  | SelectConnectionAction
  | ConnectionConnectedAction
  | DatabasesFetchedAction
  | ConnectionFailedAction
  | DatabasesFetchFailedAction
> {
  return async (dispatch, _getState, services) => {
    try {
      dispatch({
        type: GenerateDiagramWizardActionTypes.SELECT_CONNECTION,
        id: connectionId,
      });
      const connectionInfo =
        services.connections.getConnectionById(connectionId)?.info;
      if (!connectionInfo) {
        return;
      }
      await services.connections.connect(connectionInfo);
      // ConnectionsService.connect does not throw an error if it fails to establish a connection,
      // so explicitly checking if error is in the connection item and throwing it.
      const connectionError =
        services.connections.getConnectionById(connectionId)?.error;
      if (connectionError) {
        throw connectionError;
      }
    } catch (err) {
      services.logger.log.error(
        services.logger.mongoLogId(1_001_000_348),
        'DataModeling',
        'Failed to select connection',
        { err }
      );
      dispatch({
        type: GenerateDiagramWizardActionTypes.CONNECTION_FAILED,
        error: new Error('Connection failed'),
      });
      return;
    }

    try {
      dispatch({ type: GenerateDiagramWizardActionTypes.CONNECTION_CONNECTED });
      const mongoDBInstance =
        services.instanceManager.getMongoDBInstanceForConnection(connectionId);
      const dataService =
        services.connections.getDataServiceForConnection(connectionId);
      await mongoDBInstance.fetchDatabases({ dataService });
      dispatch({
        type: GenerateDiagramWizardActionTypes.DATABASES_FETCHED,
        connectionId: connectionId,
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
        services.logger.mongoLogId(1_001_000_351),
        'DataModeling',
        'Failed to list databases',
        { err }
      );
      dispatch({
        type: GenerateDiagramWizardActionTypes.DATABASES_FETCH_FAILED,
        error: err as Error,
      });
    }
  };
}

export function selectDatabase(
  database: string
): DataModelingThunkAction<
  Promise<void>,
  SelectDatabaseAction | CollectionsFetchedAction | CollectionsFetchFailedAction
> {
  return async (dispatch, getState, services) => {
    dispatch({
      type: GenerateDiagramWizardActionTypes.SELECT_DATABASE,
      database,
    });
    try {
      const { selectedConnectionId, selectedDatabase } =
        getState().generateDiagramWizard.formFields;
      if (!selectedConnectionId.value || !selectedDatabase.value) {
        return;
      }
      const mongoDBInstance =
        services.instanceManager.getMongoDBInstanceForConnection(
          selectedConnectionId.value
        );
      const dataService = services.connections.getDataServiceForConnection(
        selectedConnectionId.value
      );
      const db = mongoDBInstance.databases.get(selectedDatabase.value);
      if (!db) {
        return;
      }
      await db.fetchCollections({ dataService });
      dispatch({
        type: GenerateDiagramWizardActionTypes.COLLECTIONS_FETCHED,
        connectionId: selectedConnectionId.value,
        database: selectedDatabase.value,
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
      formFields: {
        diagramName,
        selectedConnectionId,
        selectedDatabase,
        selectedCollections,
      },
      automaticallyInferRelations,
    } = getState().generateDiagramWizard;
    if (
      !diagramName.value ||
      !selectedConnectionId.value ||
      !selectedDatabase.value ||
      !selectedCollections.value
    ) {
      return;
    }
    dispatch({
      type: GenerateDiagramWizardActionTypes.CONFIRM_SELECTED_COLLECTIONS,
    });
    void dispatch(
      startAnalysis(
        diagramName.value,
        selectedConnectionId.value,
        selectedDatabase.value,
        selectedCollections.value,
        { automaticallyInferRelations }
      )
    );
  };
}

export function cancelCreateNewDiagram(): CancelCreateNewDiagramAction {
  return { type: GenerateDiagramWizardActionTypes.CANCEL_CREATE_NEW_DIAGRAM };
}

export function toggleInferRelationships(
  newVal: boolean
): ToggleInferRelationsAction {
  return {
    type: GenerateDiagramWizardActionTypes.TOGGLE_INFER_RELATIONS,
    newVal,
  };
}
