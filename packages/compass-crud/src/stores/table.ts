import type { Reducer } from 'redux';
import type { TableState } from './crud-types';
import type { TableHeaderType } from './grid-types';

// Action Types
export enum TableActionTypes {
  DRILL_DOWN = 'compass-crud/DRILL_DOWN',
  PATH_CHANGED = 'compass-crud/PATH_CHANGED',
  RESET_TABLE = 'compass-crud/RESET_TABLE',
}

// Action Interfaces
export type DrillDownAction = {
  type: TableActionTypes.DRILL_DOWN;
  payload: Partial<TableState>;
};

export type PathChangedAction = {
  type: TableActionTypes.PATH_CHANGED;
  payload: {
    path: (string | number)[];
    types: TableHeaderType[];
  };
};

export type ResetTableAction = {
  type: TableActionTypes.RESET_TABLE;
};

export type TableActions =
  | DrillDownAction
  | PathChangedAction
  | ResetTableAction;

// Initial State
const INITIAL_STATE: TableState = {
  doc: null,
  path: [],
  types: [],
  editParams: null,
};

// Reducer
export const tableReducer: Reducer<TableState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === TableActionTypes.DRILL_DOWN) {
    return {
      ...state,
      ...action.payload,
    };
  }

  if (action.type === TableActionTypes.PATH_CHANGED) {
    return {
      ...state,
      path: action.payload.path,
      types: action.payload.types,
    };
  }

  if (action.type === TableActionTypes.RESET_TABLE) {
    return INITIAL_STATE;
  }

  return state;
};

// Action Creators
import type { CrudThunkAction } from './reducer';
import type { Document } from 'hadron-document';
import type { Element } from 'hadron-document';

export const drillDown = (
  doc: Document,
  element: Element,
  editParams?: {
    colId: string;
    rowIndex: number;
  }
): CrudThunkAction<void, TableActions> => {
  return (dispatch, getState) => {
    const tableState = getState().table;
    const path = [...tableState.path, element.currentKey];

    dispatch({
      type: TableActionTypes.DRILL_DOWN,
      payload: {
        doc,
        path,
        editParams: editParams ?? null,
      },
    });
  };
};

export const pathChanged = (
  path: (string | number)[],
  types: TableHeaderType[]
): PathChangedAction => ({
  type: TableActionTypes.PATH_CHANGED,
  payload: { path, types },
});

export const resetTable = (): ResetTableAction => ({
  type: TableActionTypes.RESET_TABLE,
});
