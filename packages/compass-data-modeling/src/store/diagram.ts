import type { Reducer } from 'redux';
import { UUID } from 'bson';
import { isAction } from './util';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import { AnalysisProcessActionTypes } from './analysis-process';
import { memoize } from 'lodash';
import type { DataModelingState, DataModelingThunkAction } from './reducer';
import { showConfirmation, showPrompt } from '@mongodb-js/compass-components';

export type DiagramState =
  | (Omit<MongoDBDataModelDescription, 'edits'> & {
      edits: {
        prev: MongoDBDataModelDescription['edits'][];
        current: MongoDBDataModelDescription['edits'];
        next: MongoDBDataModelDescription['edits'][];
      };
    })
  | null; // null when no diagram is currently open

export enum DiagramActionTypes {
  OPEN_DIAGRAM = 'data-modeling/diagram/OPEN_DIAGRAM',
  DELETE_DIAGRAM = 'data-modeling/diagram/DELETE_DIAGRAM',
  RENAME_DIAGRAM = 'data-modeling/diagram/RENAME_DIAGRAM',
  APPLY_EDIT = 'data-modeling/diagram/APPLY_EDIT',
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
  // TODO
  edit: unknown;
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
            // TODO
            type: 'SetModel',
            model: {
              schema: action.schema,
              relations: action.relations,
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
  edit: unknown
): DataModelingThunkAction<void, ApplyEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.APPLY_EDIT, edit });
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

// TODO
function _applyEdit(model: any, edit: any) {
  if (edit && 'type' in edit) {
    if (edit.type === 'SetModel') {
      return edit.model;
    }
  }
  return model;
}

export function getCurrentModel(diagram: MongoDBDataModelDescription): unknown {
  let model;
  for (const edit of diagram.edits) {
    model = _applyEdit(model, edit);
  }
  return model;
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
