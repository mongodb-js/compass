import type { Reducer } from 'redux';
import HadronDocument, { Document } from 'hadron-document';
import type { TypeCastMap } from 'hadron-type-checker';
import type { MongoServerError } from 'mongodb';
import { isAction } from '../utils/is-action';
import type { CrudThunkAction } from './reducer';
import { refreshDocuments } from './documents';
import type { DocumentView } from './view';

export type BSONObject = TypeCastMap['Object'];
export type BSONArray = TypeCastMap['Array'];

export type InsertCSFLEState = {
  state:
    | 'none'
    | 'no-known-schema'
    | 'incomplete-schema-for-cloned-doc'
    | 'has-known-schema'
    | 'csfle-disabled';
  encryptedFields?: string[];
};

export type WriteError = {
  message: string;
  info?: Record<string, unknown>;
};

export type InsertState = {
  doc: null | Document;
  jsonDoc: null | string;
  error?: WriteError;
  csfleState: InsertCSFLEState;
  mode: 'modifying' | 'error';
  jsonView: boolean;
  isOpen: boolean;
  isCommentNeeded: boolean;
};

const MODIFYING = 'modifying';
const ERROR = 'error';

export const INITIAL_INSERT_STATE: InsertState = {
  doc: null,
  jsonDoc: null,
  csfleState: { state: 'none' },
  mode: MODIFYING,
  jsonView: false,
  isOpen: false,
  isCommentNeeded: true,
};

export const InsertActionTypes = {
  OPEN_INSERT_DOCUMENT_DIALOG: 'crud/insert/OPEN_INSERT_DOCUMENT_DIALOG',
  CLOSE_INSERT_DOCUMENT_DIALOG: 'crud/insert/CLOSE_INSERT_DOCUMENT_DIALOG',
  TOGGLE_INSERT_DOCUMENT: 'crud/insert/TOGGLE_INSERT_DOCUMENT',
  TOGGLE_INSERT_DOCUMENT_VIEW: 'crud/insert/TOGGLE_INSERT_DOCUMENT_VIEW',
  UPDATE_JSON_DOC: 'crud/insert/UPDATE_JSON_DOC',
  UPDATE_COMMENT: 'crud/insert/UPDATE_COMMENT',
  INSERT_DOCUMENT_ERROR: 'crud/insert/INSERT_DOCUMENT_ERROR',
} as const;

export type OpenInsertDocumentDialogAction = {
  type: typeof InsertActionTypes.OPEN_INSERT_DOCUMENT_DIALOG;
  doc: Document;
  jsonDoc: string;
  csfleState: InsertCSFLEState;
};

export type CloseInsertDocumentDialogAction = {
  type: typeof InsertActionTypes.CLOSE_INSERT_DOCUMENT_DIALOG;
};

export type ToggleInsertDocumentAction = {
  type: typeof InsertActionTypes.TOGGLE_INSERT_DOCUMENT;
  view: DocumentView;
};

export type ToggleInsertDocumentViewAction = {
  type: typeof InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW;
  jsonView: boolean;
};

export type UpdateJsonDocAction = {
  type: typeof InsertActionTypes.UPDATE_JSON_DOC;
  jsonDoc: string | null;
};

export type UpdateCommentAction = {
  type: typeof InsertActionTypes.UPDATE_COMMENT;
  isCommentNeeded: boolean;
};

export type InsertDocumentErrorAction = {
  type: typeof InsertActionTypes.INSERT_DOCUMENT_ERROR;
  error: WriteError;
  /** Override which doc is shown in the dialog after the error. */
  doc?: Document;
  jsonDoc?: string | null;
  jsonView?: boolean;
};

export type InsertActions =
  | OpenInsertDocumentDialogAction
  | CloseInsertDocumentDialogAction
  | ToggleInsertDocumentAction
  | ToggleInsertDocumentViewAction
  | UpdateJsonDocAction
  | UpdateCommentAction
  | InsertDocumentErrorAction;

export const insertReducer: Reducer<InsertState> = (
  state = INITIAL_INSERT_STATE,
  action
) => {
  if (isAction(action, InsertActionTypes.OPEN_INSERT_DOCUMENT_DIALOG)) {
    return {
      doc: action.doc,
      jsonDoc: action.jsonDoc,
      jsonView: true,
      error: undefined,
      csfleState: action.csfleState,
      mode: MODIFYING,
      isOpen: true,
      isCommentNeeded: true,
    };
  }
  if (isAction(action, InsertActionTypes.CLOSE_INSERT_DOCUMENT_DIALOG)) {
    return INITIAL_INSERT_STATE;
  }
  if (isAction(action, InsertActionTypes.TOGGLE_INSERT_DOCUMENT)) {
    if (action.view === 'JSON') {
      const jsonDoc = state.doc?.toEJSON();
      return {
        doc: state.doc,
        jsonView: true,
        jsonDoc: jsonDoc ?? null,
        error: undefined,
        csfleState: state.csfleState,
        mode: MODIFYING,
        isOpen: true,
        isCommentNeeded: state.isCommentNeeded,
      };
    }
    let hadronDoc;
    if (state.jsonDoc === '') {
      hadronDoc = state.doc;
    } else {
      hadronDoc = HadronDocument.FromEJSON(state.jsonDoc ?? '');
    }
    return {
      doc: hadronDoc,
      jsonView: false,
      jsonDoc: state.jsonDoc,
      error: undefined,
      csfleState: state.csfleState,
      mode: MODIFYING,
      isOpen: true,
      isCommentNeeded: state.isCommentNeeded,
    };
  }
  if (isAction(action, InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW)) {
    return {
      doc: new Document({}),
      jsonDoc: state.jsonDoc,
      jsonView: action.jsonView,
      error: undefined,
      csfleState: state.csfleState,
      mode: MODIFYING,
      isOpen: true,
      isCommentNeeded: state.isCommentNeeded,
    };
  }
  if (isAction(action, InsertActionTypes.UPDATE_JSON_DOC)) {
    return {
      doc: new Document({}),
      jsonDoc: action.jsonDoc,
      jsonView: true,
      error: undefined,
      csfleState: state.csfleState,
      mode: MODIFYING,
      isOpen: true,
      isCommentNeeded: state.isCommentNeeded,
    };
  }
  if (isAction(action, InsertActionTypes.UPDATE_COMMENT)) {
    return { ...state, isCommentNeeded: action.isCommentNeeded };
  }
  if (isAction(action, InsertActionTypes.INSERT_DOCUMENT_ERROR)) {
    return {
      doc: action.doc ?? state.doc,
      jsonDoc: action.jsonDoc ?? state.jsonDoc,
      jsonView: action.jsonView ?? state.jsonView,
      error: action.error,
      csfleState: state.csfleState,
      mode: ERROR,
      isOpen: true,
      isCommentNeeded: state.isCommentNeeded,
    };
  }
  return state;
};

export function closeInsertDocumentDialog(): CloseInsertDocumentDialogAction {
  return { type: InsertActionTypes.CLOSE_INSERT_DOCUMENT_DIALOG };
}

export function toggleInsertDocument(
  view: DocumentView
): ToggleInsertDocumentAction {
  return { type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT, view };
}

export function toggleInsertDocumentView(
  view: DocumentView
): ToggleInsertDocumentViewAction {
  return {
    type: InsertActionTypes.TOGGLE_INSERT_DOCUMENT_VIEW,
    jsonView: view === 'JSON',
  };
}

export function updateJsonDoc(jsonDoc: string | null): UpdateJsonDocAction {
  return { type: InsertActionTypes.UPDATE_JSON_DOC, jsonDoc };
}

export function updateComment(isCommentNeeded: boolean): UpdateCommentAction {
  return { type: InsertActionTypes.UPDATE_COMMENT, isCommentNeeded };
}

function getWriteError(error: Error): WriteError {
  return {
    message: error.message,
    info: (error as MongoServerError).errInfo,
  };
}

export function openInsertDocumentDialog(
  doc: BSONObject,
  clone = false
): CrudThunkAction<Promise<void>, OpenInsertDocumentDialogAction> {
  return async (
    dispatch,
    getState,
    { dataService, track, connectionInfoRef }
  ) => {
    const hadronDoc = new HadronDocument(doc);

    if (clone) {
      track(
        'Document Cloned',
        {
          mode: getState().view.view.toLowerCase() as 'list' | 'json' | 'table',
        },
        connectionInfoRef.current
      );
      // We need to remove the _id or we will get a duplicate key error on
      // insert, and we currently do not allow editing of the _id field.
      for (const element of hadronDoc.elements) {
        if (element.currentKey === '_id') {
          hadronDoc.elements.remove(element);
          break;
        }
      }
    }

    const csfleState: InsertCSFLEState = { state: 'none' };
    const dataServiceCSFLEMode = dataService.getCSFLEMode?.();
    const ns = getState().documents.ns;
    if (dataServiceCSFLEMode === 'enabled') {
      const {
        hasSchema,
        encryptedFields: { encryptedFields },
      } = await dataService.knownSchemaForCollection(ns);
      if (encryptedFields.length > 0) {
        // This is for displaying encrypted fields to the user. We do not really
        // need to worry about the distinction between '.' as a nested-field
        // indicator and '.' as a literal part of a field name here, esp. since
        // automatic Queryable Encryption does not support '.' in field names at all.
        csfleState.encryptedFields = encryptedFields.map((field) =>
          field.join('.')
        );
      }
      if (!hasSchema) {
        csfleState.state = 'no-known-schema';
      } else if (!(await dataService.isUpdateAllowed?.(ns, doc))) {
        csfleState.state = 'incomplete-schema-for-cloned-doc';
      } else {
        csfleState.state = 'has-known-schema';
      }
    } else if (dataServiceCSFLEMode === 'disabled') {
      csfleState.state = 'csfle-disabled';
    }

    dispatch({
      type: InsertActionTypes.OPEN_INSERT_DOCUMENT_DIALOG,
      doc: hadronDoc,
      jsonDoc: hadronDoc.toEJSON(),
      csfleState,
    });
  };
}

export function insertMany(): CrudThunkAction<Promise<void>, InsertActions> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      fieldStoreService,
      connectionScopedAppRegistry,
      track,
      connectionInfoRef,
    }
  ) => {
    const state = getState();
    const ns = state.documents.ns;
    const view = state.view.view;
    const insertState = state.insert;
    try {
      const schemaFields = fieldStoreService.getSchemaFieldsForNamespace(ns);
      const docs = HadronDocument.FromEJSONArray(insertState.jsonDoc ?? '').map(
        (doc) => {
          if (schemaFields) {
            doc.preserveTypesFromSchema(schemaFields);
          }
          return doc.generateObject();
        }
      );
      track(
        'Document Inserted',
        {
          mode: insertState.jsonView ? 'json' : 'field-by-field',
          multiple: docs.length > 1,
        },
        connectionInfoRef.current
      );

      await dataService.insertMany(ns, docs);
      const payload = {
        ns: ns,
        view: view,
        mode: insertState.jsonView ? 'json' : 'default',
        multiple: true,
        docs,
      };
      void fieldStoreService.updateFieldsFromDocuments(ns, docs);
      // TODO(COMPASS-7815): Remove this event and use AppStoreService
      connectionScopedAppRegistry.emit('document-inserted', payload);

      dispatch(closeInsertDocumentDialog());
    } catch (error) {
      dispatch({
        type: InsertActionTypes.INSERT_DOCUMENT_ERROR,
        error: getWriteError(error as Error),
        doc: new Document({}),
        jsonDoc: insertState.jsonDoc,
        jsonView: true,
      });
    }

    // Since we are inserting a bunch of documents and we need to rerun all
    // the queries and counts for them, let's just refresh the whole set of
    // documents.
    await dispatch(refreshDocuments());
  };
}

export function insertDocument(): CrudThunkAction<
  Promise<void>,
  InsertActions
> {
  return async (
    dispatch,
    getState,
    {
      dataService,
      fieldStoreService,
      connectionScopedAppRegistry,
      track,
      connectionInfoRef,
    }
  ) => {
    const state = getState();
    const ns = state.documents.ns;
    const view = state.view.view;
    const insertState = state.insert;

    track(
      'Document Inserted',
      {
        mode: insertState.jsonView ? 'json' : 'field-by-field',
        multiple: false,
      },
      connectionInfoRef.current
    );

    let doc: BSONObject;
    try {
      const schemaFields = fieldStoreService.getSchemaFieldsForNamespace(ns);
      if (insertState.jsonView) {
        const hadronDoc = HadronDocument.FromEJSON(insertState.jsonDoc ?? '');
        if (schemaFields) {
          hadronDoc.preserveTypesFromSchema(schemaFields);
        }
        doc = hadronDoc.generateObject();
      } else {
        // Create a fresh document from the current state to avoid mutating
        // the insert dialog's document in place (which would be a side
        // effect visible on retry if the insert fails).
        const hadronDoc = new HadronDocument(insertState.doc!.generateObject());
        if (schemaFields) {
          hadronDoc.preserveTypesFromSchema(schemaFields);
        }
        doc = hadronDoc.generateObject();
      }
      await dataService.insertOne(ns, doc);

      const payload = {
        ns,
        view,
        mode: insertState.jsonView ? 'json' : 'default',
        multiple: false,
        docs: [doc],
      };
      void fieldStoreService.updateFieldsFromDocuments(ns, [doc]);
      // TODO(COMPASS-7815): Remove this event and use AppStoreService
      connectionScopedAppRegistry.emit('document-inserted', payload);

      dispatch(closeInsertDocumentDialog());
    } catch (error) {
      dispatch({
        type: InsertActionTypes.INSERT_DOCUMENT_ERROR,
        error: getWriteError(error as Error),
      });
      return;
    }

    await dispatch(refreshDocuments());
  };
}
