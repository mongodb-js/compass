import type { Reducer } from 'redux';
import type { InsertState } from './crud-types';
import { Document } from 'hadron-document';

// Action Types
export enum InsertActionTypes {
  OPEN_INSERT_DIALOG = 'compass-crud/OPEN_INSERT_DIALOG',
  CLOSE_INSERT_DIALOG = 'compass-crud/CLOSE_INSERT_DIALOG',
  UPDATE_JSON_DOC = 'compass-crud/UPDATE_JSON_DOC',
  TOGGLE_INSERT_DOCUMENT_VIEW = 'compass-crud/TOGGLE_INSERT_DOCUMENT_VIEW',
  UPDATE_COMMENT = 'compass-crud/UPDATE_COMMENT',
  INSERT_ERROR = 'compass-crud/INSERT_ERROR',
}

// Action Interfaces
export type OpenInsertDialogAction = {
  type: InsertActionTypes.OPEN_INSERT_DIALOG;
  payload: Partial<InsertState>;
};

export type CloseInsertDialogAction = {
  type: InsertActionTypes.CLOSE_INSERT_DIALOG;
};

export type UpdateJsonDocAction = {
  type: InsertActionTypes.UPDATE_JSON_DOC;
  jsonDoc: string | null;
};

export type ToggleInsertDocumentViewAction = {
  type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW;
  jsonView: boolean;
};

export type UpdateCommentAction = {
  type: InsertActionTypes.UPDATE_COMMENT;
  isCommentNeeded: boolean;
};

export type InsertErrorAction = {
  type: InsertActionTypes.INSERT_ERROR;
  error: any;
};

export type InsertActions =
  | OpenInsertDialogAction
  | CloseInsertDialogAction
  | UpdateJsonDocAction
  | ToggleInsertDocumentViewAction
  | UpdateCommentAction
  | InsertErrorAction;

// Initial State
const INITIAL_STATE: InsertState = {
  doc: null,
  jsonDoc: null,
  csfleState: { state: 'none' },
  mode: 'modifying',
  jsonView: false,
  isOpen: false,
  isCommentNeeded: true,
};

// Reducer
export const insertReducer: Reducer<InsertState> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === InsertActionTypes.OPEN_INSERT_DIALOG) {
    return {
      ...state,
      ...action.payload,
      isOpen: true,
    };
  }

  if (action.type === InsertActionTypes.CLOSE_INSERT_DIALOG) {
    return INITIAL_STATE;
  }

  if (action.type === InsertActionTypes.UPDATE_JSON_DOC) {
    return {
      ...state,
      jsonDoc: action.jsonDoc,
      doc: new Document({}),
    };
  }

  if (action.type === InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW) {
    return {
      ...state,
      jsonView: action.jsonView,
    };
  }

  if (action.type === InsertActionTypes.UPDATE_COMMENT) {
    return {
      ...state,
      isCommentNeeded: action.isCommentNeeded,
    };
  }

  if (action.type === InsertActionTypes.INSERT_ERROR) {
    return {
      ...state,
      error: action.error,
      mode: 'error',
    };
  }

  return state;
};

// Action Creators and Thunks
import type { CrudThunkAction } from './reducer';
import type { BSONObject } from './crud-types';
import HadronDocument from 'hadron-document';

export const openInsertDocumentDialog = (
  doc: BSONObject,
  clone = false
): CrudThunkAction<Promise<void>, InsertActions> => {
  return async (dispatch, _getState, { dataService, namespace }) => {
    const hadronDoc = new HadronDocument(doc);

    if (clone) {
      // Remove _id for cloning
      for (const element of hadronDoc.elements) {
        if (element.currentKey === '_id') {
          hadronDoc.elements.remove(element);
          break;
        }
      }
    }

    const csfleState: InsertState['csfleState'] = { state: 'none' };
    const dataServiceCSFLEMode = dataService.getCSFLEMode?.();

    if (dataServiceCSFLEMode === 'enabled') {
      const {
        hasSchema,
        encryptedFields: { encryptedFields },
      } = await dataService.knownSchemaForCollection(namespace);

      if (encryptedFields.length > 0) {
        csfleState.encryptedFields = encryptedFields.map((field: string[]) =>
          field.join('.')
        );
      }

      if (!hasSchema) {
        csfleState.state = 'no-known-schema';
      } else if (!(await dataService.isUpdateAllowed?.(namespace, doc))) {
        csfleState.state = 'incomplete-schema-for-cloned-doc';
      } else {
        csfleState.state = 'has-known-schema';
      }
    } else if (dataServiceCSFLEMode === 'disabled') {
      csfleState.state = 'csfle-disabled';
    }

    const jsonDoc = hadronDoc.toEJSON();

    dispatch({
      type: InsertActionTypes.OPEN_INSERT_DIALOG,
      payload: {
        doc: hadronDoc,
        jsonDoc,
        jsonView: true,
        error: undefined,
        csfleState,
        mode: 'modifying',
        isOpen: true,
        isCommentNeeded: true,
      },
    });
  };
};

export const closeInsertDocumentDialog = (): CloseInsertDialogAction => ({
  type: InsertActionTypes.CLOSE_INSERT_DIALOG,
});

export const updateJsonDoc = (value: string | null): UpdateJsonDocAction => ({
  type: InsertActionTypes.UPDATE_JSON_DOC,
  jsonDoc: value,
});

export const toggleInsertDocument = (
  view: 'JSON' | 'List'
): CrudThunkAction<void, InsertActions> => {
  return (dispatch, getState) => {
    const state = getState().insert;

    if (view === 'JSON') {
      const jsonDoc = state.doc?.toEJSON();
      dispatch({
        type: InsertActionTypes.OPEN_INSERT_DIALOG,
        payload: {
          doc: state.doc,
          jsonView: true,
          jsonDoc: jsonDoc ?? null,
        },
      });
    } else {
      let hadronDoc;
      if (state.jsonDoc === '') {
        hadronDoc = state.doc;
      } else {
        hadronDoc = HadronDocument.FromEJSON(state.jsonDoc ?? '');
      }
      dispatch({
        type: InsertActionTypes.OPEN_INSERT_DIALOG,
        payload: {
          doc: hadronDoc,
          jsonView: false,
          jsonDoc: state.jsonDoc,
        },
      });
    }
  };
};

export const toggleInsertDocumentView = (): CrudThunkAction<
  void,
  InsertActions
> => {
  return (dispatch, getState) => {
    const { insert } = getState();
    dispatch({
      type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW,
      jsonView: !insert.jsonView,
    });
  };
};

export const updateComment = (
  isCommentNeeded: boolean
): UpdateCommentAction => ({
  type: InsertActionTypes.UPDATE_COMMENT,
  isCommentNeeded,
});

export const insertDocument = (): CrudThunkAction<
  Promise<void>,
  InsertActions
> => {
  return async (
    dispatch,
    getState,
    {
      dataService,
      namespace,
      track,
      connectionInfoRef,
      fieldStoreService,
      connectionScopedAppRegistry,
      localAppRegistry,
    }
  ) => {
    const state = getState().insert;
    const crudState = getState().crud;
    if (!crudState) return;

    const view = crudState.view;

    let doc: BSONObject;

    try {
      if (state.jsonView) {
        doc = HadronDocument.FromEJSON(state.jsonDoc ?? '').generateObject();
      } else {
        doc = state.doc!.generateObject();
      }

      await dataService.insertOne(namespace, doc);

      track(
        'Document Inserted',
        {
          mode: state.jsonView ? 'json' : 'field-by-field',
          multiple: false,
        },
        connectionInfoRef.current
      );

      const payload = {
        ns: namespace,
        view,
        mode: state.jsonView ? 'json' : 'default',
        multiple: false,
        docs: [doc],
      };

      void fieldStoreService.updateFieldsFromDocuments(namespace, [doc]);
      connectionScopedAppRegistry.emit('document-inserted', payload);
      localAppRegistry.emit('document-inserted', payload);

      dispatch({ type: InsertActionTypes.CLOSE_INSERT_DIALOG });
    } catch (error) {
      dispatch({
        type: InsertActionTypes.INSERT_ERROR,
        error: {
          message: (error as Error).message,
          info: (error as any).errInfo,
        },
      });
    }
  };
};

export const updateDocument = (
  doc: any
): CrudThunkAction<void, InsertActions> => {
  return () => {
    // Placeholder - this is handled in crud.ts directly on the document
    void doc;
  };
};

export const replaceDocument = (
  doc: any
): CrudThunkAction<void, InsertActions> => {
  return () => {
    // Placeholder - this is handled in crud.ts directly on the document
    void doc;
  };
};

export const removeDocument = (
  doc: any
): CrudThunkAction<void, InsertActions> => {
  return () => {
    // Placeholder - this is handled in crud.ts directly on the document
    void doc;
  };
};
