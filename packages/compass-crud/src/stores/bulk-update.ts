import type { Reducer } from 'redux';
import type { BulkUpdateState } from './crud-types';
import { INITIAL_BULK_UPDATE_TEXT } from './crud-types';
import type { CrudThunkAction } from './reducer';

// Action Types
export enum BulkUpdateActionTypes {
  OPEN_BULK_UPDATE_MODAL = 'compass-crud/OPEN_BULK_UPDATE_MODAL',
  CLOSE_BULK_UPDATE_MODAL = 'compass-crud/CLOSE_BULK_UPDATE_MODAL',
  UPDATE_BULK_UPDATE_PREVIEW = 'compass-crud/UPDATE_BULK_UPDATE_PREVIEW',
  SET_BULK_UPDATE_AFFECTED = 'compass-crud/SET_BULK_UPDATE_AFFECTED',
}

// Action Interfaces
export type OpenBulkUpdateModalAction = {
  type: BulkUpdateActionTypes.OPEN_BULK_UPDATE_MODAL;
  payload: Partial<BulkUpdateState>;
};

export type CloseBulkUpdateModalAction = {
  type: BulkUpdateActionTypes.CLOSE_BULK_UPDATE_MODAL;
};

export type UpdateBulkUpdatePreviewAction = {
  type: BulkUpdateActionTypes.UPDATE_BULK_UPDATE_PREVIEW;
  payload: Partial<BulkUpdateState>;
};

export type SetBulkUpdateAffectedAction = {
  type: BulkUpdateActionTypes.SET_BULK_UPDATE_AFFECTED;
  affected: number | undefined;
};

export type BulkUpdateActions =
  | OpenBulkUpdateModalAction
  | CloseBulkUpdateModalAction
  | UpdateBulkUpdatePreviewAction
  | SetBulkUpdateAffectedAction;

// Initial State
const INITIAL_STATE: BulkUpdateState = {
  isOpen: false,
  updateText: INITIAL_BULK_UPDATE_TEXT,
  preview: {
    changes: [],
  },
  syntaxError: undefined,
  serverError: undefined,
};

// Thunk Actions
export const openBulkUpdateModal = (
  updateText?: string
): CrudThunkAction<void, BulkUpdateActions> => {
  return (dispatch, _getState, { track, connectionInfoRef }) => {
    const state = _getState();
    track(
      'Bulk Update Opened',
      {
        isUpdatePreviewSupported: state.crud?.isUpdatePreviewSupported ?? false,
      },
      connectionInfoRef.current
    );

    dispatch({
      type: BulkUpdateActionTypes.OPEN_BULK_UPDATE_MODAL,
      payload: {
        isOpen: true,
        updateText: updateText ?? INITIAL_BULK_UPDATE_TEXT,
      },
    });
  };
};

export const closeBulkUpdateModal = (): CloseBulkUpdateModalAction => ({
  type: BulkUpdateActionTypes.CLOSE_BULK_UPDATE_MODAL,
});

// Reducer
export const bulkUpdateReducer: Reducer<BulkUpdateState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === BulkUpdateActionTypes.OPEN_BULK_UPDATE_MODAL) {
    return {
      ...state,
      ...action.payload,
      isOpen: true,
    };
  }

  if (action.type === BulkUpdateActionTypes.CLOSE_BULK_UPDATE_MODAL) {
    return {
      ...state,
      isOpen: false,
    };
  }

  if (action.type === BulkUpdateActionTypes.UPDATE_BULK_UPDATE_PREVIEW) {
    return {
      ...state,
      ...action.payload,
    };
  }

  if (action.type === BulkUpdateActionTypes.SET_BULK_UPDATE_AFFECTED) {
    return {
      ...state,
      affected: action.affected,
    };
  }

  return state;
};

// Additional action creators
export const updateTextChanged = (
  updateText: string
): CrudThunkAction<void, BulkUpdateActions> => {
  return (dispatch) => {
    dispatch({
      type: BulkUpdateActionTypes.UPDATE_BULK_UPDATE_PREVIEW,
      payload: {
        updateText,
        preview: { changes: [] },
      },
    });
  };
};

export const runBulkUpdate = (): CrudThunkAction<
  Promise<void>,
  BulkUpdateActions
> => {
  return async () => {
    // This will be implemented to actually run the update
  };
};

export const saveUpdateQuery = (
  name: string
): CrudThunkAction<Promise<void>, BulkUpdateActions> => {
  return async (
    _dispatch,
    getState,
    { favoriteQueriesStorage, namespace, queryBar, track, connectionInfoRef }
  ) => {
    const state = getState().bulkUpdate;
    const query = queryBar.getLastAppliedQuery('crud');

    track(
      'Bulk Update Favorited',
      {
        isUpdatePreviewSupported:
          getState().crud?.isUpdatePreviewSupported ?? false,
      },
      connectionInfoRef.current
    );

    // Parse and save the update query
    try {
      // Save to favorites
      await favoriteQueriesStorage?.saveQuery({
        _name: name,
        _ns: namespace,
        filter: query.filter,
        update: state.updateText,
      });
    } catch (error) {
      // Handle error silently - saveQuery will handle errors internally
      void error;
    }
  };
};
