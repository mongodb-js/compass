import type { Reducer } from 'redux';
import { UUID } from 'bson';
import { isAction } from './util';
import type { MongoDBDataModelDescription } from '../services/data-model-storage';
import { AnalysisProcessActionTypes } from './analysis-process';
import { memoize } from 'lodash';
import type { DataModelingThunkAction } from './reducer';

export type DiagramState = {
  prev: MongoDBDataModelDescription[];
  // null when no diagram is currently open / created
  current: MongoDBDataModelDescription | null;
  next: MongoDBDataModelDescription[];
};

export enum DiagramActionTypes {
  OPEN_DIAGRAM = 'data-modeling/diagram/OPEN_DIAGRAM',
  APPLY_EDIT = 'data-modeling/diagram/APPLY_EDIT',
  UNDO_EDIT = 'data-modeling/diagram/UNDO_EDIT',
  REDO_EDIT = 'data-modeling/diagram/REDO_EDIT',
}

export type OpenDiagramAction = {
  type: DiagramActionTypes.OPEN_DIAGRAM;
  diagram: MongoDBDataModelDescription;
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
  | ApplyEditAction
  | UndoEditAction
  | RedoEditAction;

const INITIAL_STATE: DiagramState = {
  prev: [],
  current: null,
  next: [],
};

export const diagramReducer: Reducer<DiagramState> = (
  state = INITIAL_STATE,
  action
) => {
  if (isAction(action, DiagramActionTypes.OPEN_DIAGRAM)) {
    return {
      prev: [],
      current: action.diagram,
      next: [],
    };
  }

  if (isAction(action, AnalysisProcessActionTypes.ANALYSIS_FINISHED)) {
    return {
      prev: [],
      current: {
        id: new UUID().toString(),
        name: action.name,
        connectionId: action.connectionId,
        edits: [
          {
            type: 'SetModel',
            model: {
              schema: action.schema,
              relations: action.relations,
            },
          },
        ],
      },
      next: [],
    };
  }

  // All actions below are only applicable when diagram is open
  if (!state.current) {
    return state;
  }

  if (isAction(action, DiagramActionTypes.APPLY_EDIT)) {
    return {
      prev: [...state.prev, state.current],
      current: {
        ...state.current,
        edits: [...state.current.edits, action.edit],
      },
      next: [],
    };
  }
  if (isAction(action, DiagramActionTypes.UNDO_EDIT)) {
    const newCurrent = state.prev.pop();
    if (!newCurrent) {
      return state;
    }
    return {
      prev: [...state.prev],
      current: newCurrent,
      next: [...state.next, state.current],
    };
  }
  if (isAction(action, DiagramActionTypes.REDO_EDIT)) {
    const newCurrent = state.next.pop();
    if (!newCurrent) {
      return state;
    }
    return {
      prev: [...state.prev, state.current],
      current: newCurrent,
      next: [...state.next],
    };
  }
  return state;
};

export function undoEdit(): DataModelingThunkAction<void, UndoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.UNDO_EDIT });
    void dataModelStorage.save(getState().diagram.current!);
  };
}

export function redoEdit(): DataModelingThunkAction<void, RedoEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.REDO_EDIT });
    void dataModelStorage.save(getState().diagram.current!);
  };
}

export function applyEdit(
  edit: unknown
): DataModelingThunkAction<void, ApplyEditAction> {
  return (dispatch, getState, { dataModelStorage }) => {
    dispatch({ type: DiagramActionTypes.APPLY_EDIT, edit });
    void dataModelStorage.save(getState().diagram.current!);
  };
}

export function openDiagram(diagram: MongoDBDataModelDescription) {
  return { type: DiagramActionTypes.OPEN_DIAGRAM, diagram };
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

export const selectCurrentModel = memoize(getCurrentModel);
