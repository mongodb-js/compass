import type { Reducer } from 'redux';
import { UUID } from 'bson';
import { isAction } from './util';
import {
  validateEdit,
  type Edit,
  type MongoDBDataModelDescription,
  type StaticModel,
} from '../services/data-model-storage';
import { AnalysisProcessActionTypes } from './analysis-process';
import { memoize } from 'lodash';
import type { DataModelingState, DataModelingThunkAction } from './reducer';
import { showConfirmation, showPrompt } from '@mongodb-js/compass-components';

export type DiagramState =
  | (Omit<MongoDBDataModelDescription, 'edits'> & {
      edits: {
        prev: Edit[][];
        current: Edit[];
        next: Edit[][];
      };
      editErrors?: string[];
    })
  | null; // null when no diagram is currently open

export enum DiagramActionTypes {
  OPEN_DIAGRAM = 'data-modeling/diagram/OPEN_DIAGRAM',
  DELETE_DIAGRAM = 'data-modeling/diagram/DELETE_DIAGRAM',
  RENAME_DIAGRAM = 'data-modeling/diagram/RENAME_DIAGRAM',
  APPLY_EDIT = 'data-modeling/diagram/APPLY_EDIT',
  APPLY_EDIT_FAILED = 'data-modeling/diagram/APPLY_EDIT_FAILED',
  UNDO_EDIT = 'data-modeling/diagram/UNDO_EDIT',
  REDO_EDIT = 'data-modeling/diagram/REDO_EDIT',
}

export type OpenDiagramAction = {
  type: DiagramActionTypes.OPEN_DIAGRAM;
  diagram: MongoDBDataModelDescription;
};

export type DeleteDiagramAction = {
  type: DiagramActionTypes.DELETE_DIAGRAM;
  isCurrent: boolean; // technically a derived state, but we don't have access to this in some slices
};

export type RenameDiagramAction = {
  type: DiagramActionTypes.RENAME_DIAGRAM;
  id: string;
  name: string;
};

export type ApplyEditAction = {
  type: DiagramActionTypes.APPLY_EDIT;
  edit: Edit;
};

export type ApplyEditFailedAction = {
  type: DiagramActionTypes.APPLY_EDIT_FAILED;
  errors: string[];
};

export type UndoEditAction = {
  type: DiagramActionTypes.UNDO_EDIT;
};

export type RedoEditAction = {
  type: DiagramActionTypes.REDO_EDIT;
};

export type DiagramActions =
  | OpenDiagramAction
  | DeleteDiagramAction
  | RenameDiagramAction
  | ApplyEditAction
  | ApplyEditFailedAction
  | UndoEditAction
  | RedoEditAction;

const INITIAL_STATE: DiagramState = null;

export const diagramReducer: Reducer<DiagramState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, DiagramActionTypes.OPEN_DIAGRAM)) {
    return {
      id: action.diagram.id,
      connectionId: action.diagram.connectionId,
      name: action.diagram.name,
      edits: {
        prev: [],
        current: action.diagram.edits,
        next: [],
      },
    };
  }

  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED)) {
    return {
      id: new UUID().toString(),
      name: action.name,
      connectionId: action.connectionId,
      edits: {
        prev: [],
        current: [
          {
            type: 'SetModel',
            id: new UUID().toString(),
            timestamp: new Date().toISOString(),
            model: {
              collections: action.collections.map((collection) => ({
                ns: collection.ns,
                jsonSchema: collection.schema,
                // TODO
                indexes: [],
                shardKey: undefined,
                displayPosition: [0, 0],
              })),
              relationships: action.relations,
            },
          },
        ],
        next: [],
      },
    };
  }

  // All actions below are only applicable when diagram is open
  if (!state) {
    return state;
  }

  if (isAction(action, DiagramActionTypes.RENAME_DIAGRAM)) {
    return {
      ...state,
      name: action.name,
    };
  }
  if (isAction(action, DiagramActionTypes.APPLY_EDIT)) {
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev, state.edits.current],
        current: [...state.edits.current, action.edit],
        next: [],
      },
      editErrors: undefined,
    };
  }
  if (isAction(action, DiagramActionTypes.APPLY_EDIT_FAILED)) {
    return {
      ...state,
      editErrors: action.errors,
    };
  }
  if (isAction(action, DiagramActionTypes.UNDO_EDIT)) {
    const newCurrent = state.edits.prev.pop();
    if (!newCurrent) {
      return state;
    }
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev],
        current: newCurrent,
        next: [...state.edits.next, state.edits.current],
      },
    };
  }
  if (isAction(action, DiagramActionTypes.REDO_EDIT)) {
    const newCurrent = state.edits.next.pop();
    if (!newCurrent) {
      return state;
    }
    return {
      ...state,
      edits: {
        prev: [...state.edits.prev, state.edits.current],
        current: newCurrent,
        next: [...state.edits.next],
      },
    };
  }
  return state;
};

export function undoEdit(): DataModelingThunkAction<void, UndoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.UNDO_EDIT });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
  };
}

export function redoEdit(): DataModelingThunkAction<void, RedoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.REDO_EDIT });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
  };
}

export function applyEdit(
  rawEdit: Omit<Edit, 'id' | 'timestamp'>
): DataModelingThunkAction<void, ApplyEditAction | ApplyEditFailedAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    const edit = {
      ...rawEdit,
      id: new UUID().toString(),
      timestamp: new Date().toISOString(),
      // TS has a problem recognizing the discriminated union
    } as Edit;
    const { result: isValid, errors } = validateEdit(edit);
    if (!isValid) {
      dispatch({
        type: DiagramActionTypes.APPLY_EDIT_FAILED,
        errors,
      });
      return;
    }
    dispatch({
      type: DiagramActionTypes.APPLY_EDIT,
      edit,
    });
    void dataModelStorage.save(getCurrentDiagramFromState(getState()));
  };
}

export function openDiagram(diagram: MongoDBDataModelDescription) {
  return { type: DiagramActionTypes.OPEN_DIAGRAM, diagram };
}

export function deleteDiagram(
  id: string
): DataModelingThunkAction<Promise<void>, DeleteDiagramAction> {
  return async (dispatch, getState, { dataModelStorage }) => {
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to delete this diagram?',
      description: 'This action can not be undone',
      variant: 'danger',
    });
    if (!confirmed) {
      return;
    }
    const isCurrent = getState().diagram?.id === id;
    dispatch({ type: DiagramActionTypes.DELETE_DIAGRAM, isCurrent });
    void dataModelStorage.delete(id);
  };
}

export function renameDiagram(
  id: string // TODO maybe pass the whole thing here, we always have it when calling this, then we don't need to re-load storage
): DataModelingThunkAction<Promise<void>, RenameDiagramAction> {
  return async (dispatch, getState, { dataModelStorage }) => {
    try {
      const diagram = await dataModelStorage.load(id);
      if (!diagram) {
        return;
      }
      const newName = await showPrompt({
        title: 'Rename diagram',
        label: 'Name',
        defaultValue: diagram.name,
      });
      if (!newName) {
        return;
      }
      dispatch({ type: DiagramActionTypes.RENAME_DIAGRAM, id, name: newName });
      void dataModelStorage.save({ ...diagram, name: newName });
    } catch (err) {
      // TODO log
    }
  };
}

function _applyEdit(edit: Edit, model?: StaticModel): StaticModel {
  if (edit.type === 'SetModel') {
    return edit.model;
  }
  if (!model) {
    throw new Error('Editing a model that has not been initialized');
  }
  switch (edit.type) {
    case 'AddRelationship': {
      return {
        ...model,
        relationships: [...model.relationships, edit.relationship],
      };
    }
    case 'RemoveRelationship': {
      return {
        ...model,
        relationships: model.relationships.filter(
          (relationship) => relationship.id !== edit.relationshipId
        ),
      };
    }
    default: {
      return model;
    }
  }
}

export function getCurrentModel(
  description: MongoDBDataModelDescription
): StaticModel {
  // Get the last 'SetModel' edit.
  const reversedSetModelEditIndex = description.edits
    .slice()
    .reverse()
    .findIndex((edit) => edit.type === 'SetModel');
  if (reversedSetModelEditIndex === -1) {
    throw new Error('No diagram model found.');
  }

  // Calculate the actual index in the original array.
  const lastSetModelEditIndex =
    description.edits.length - 1 - reversedSetModelEditIndex;

  // Start with the StaticModel from the last `SetModel` edit.
  const lastSetModelEdit = description.edits[lastSetModelEditIndex];
  if (lastSetModelEdit.type !== 'SetModel') {
    throw new Error('Something went wrong, last edit is not a SetModel');
  }
  let currentModel = lastSetModelEdit.model;

  // Apply all subsequent edits after the last `SetModel` edit.
  for (let i = lastSetModelEditIndex + 1; i < description.edits.length; i++) {
    const edit = description.edits[i];
    currentModel = _applyEdit(edit, currentModel);
  }

  return currentModel;
}

export function getCurrentDiagramFromState(
  state: DataModelingState
): MongoDBDataModelDescription {
  if (!state.diagram) {
    throw new Error('No current diagram in state');
  }
  const {
    id,
    connectionId,
    name,
    edits: { current: edits },
  } = state.diagram;

  return { id, connectionId, name, edits };
}

export const selectCurrentModel = memoize(getCurrentModel);
