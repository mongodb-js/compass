import type { Reducer } from 'redux';
import type { Document } from 'hadron-document';
import type { Element } from 'hadron-document';
import type { TableHeaderType } from './grid-store';
import { isAction } from '../utils/is-action';
import { DocumentsActionTypes } from './documents';

const DOCUMENT_VIEWS = ['List', 'JSON', 'Table'] as const;
export type DocumentView = (typeof DOCUMENT_VIEWS)[number];
export type DocumentViewTelemetry = Lowercase<(typeof DOCUMENT_VIEWS)[number]>;

export type TableState = {
  doc: Document | null;
  path: (string | number)[];
  types: TableHeaderType[];
  editParams: null | {
    colId: string | number;
    rowIndex: number;
  };
};

/**
 * The key we use to persist the user selected document view for other tabs or
 * for the next application start.
 * Exported only for test purpose
 */
export const DOCUMENT_VIEW_STORAGE_KEY = 'compass_crud-document_view';

function getInitialDocumentView(): DocumentView {
  const view = localStorage.getItem(DOCUMENT_VIEW_STORAGE_KEY);
  if (DOCUMENT_VIEWS.includes(view as DocumentView)) {
    return view as DocumentView;
  }
  return 'List';
}

export type ViewState = {
  view: DocumentView;
  table: TableState;
};

export const INITIAL_TABLE_STATE: TableState = {
  doc: null,
  path: [],
  types: [],
  editParams: null,
};

export const getInitialViewState = (): ViewState => {
  return {
    view: getInitialDocumentView(),
    table: INITIAL_TABLE_STATE,
  };
};

export const ViewActionTypes = {
  VIEW_CHANGED: 'crud/view/VIEW_CHANGED',
  DRILL_DOWN: 'crud/view/DRILL_DOWN',
  PATH_CHANGED: 'crud/view/PATH_CHANGED',
} as const;

export type ViewChangedAction = {
  type: typeof ViewActionTypes.VIEW_CHANGED;
  view: DocumentView;
};

export type DrillDownAction = {
  type: typeof ViewActionTypes.DRILL_DOWN;
  doc: Document;
  element: Element;
  editParams: TableState['editParams'];
};

export type PathChangedAction = {
  type: typeof ViewActionTypes.PATH_CHANGED;
  path: (string | number)[];
  types: TableHeaderType[];
};

export type ViewActions =
  | ViewChangedAction
  | DrillDownAction
  | PathChangedAction;

export const viewReducer: Reducer<ViewState> = (
  state = getInitialViewState(),
  action
) => {
  if (isAction(action, ViewActionTypes.VIEW_CHANGED)) {
    return { ...state, view: action.view };
  }
  if (isAction(action, ViewActionTypes.DRILL_DOWN)) {
    return {
      ...state,
      table: {
        path: state.table.path.concat([action.element.currentKey]),
        types: state.table.types.concat([action.element.currentType]),
        doc: action.doc,
        editParams: action.editParams,
      },
    };
  }
  if (isAction(action, ViewActionTypes.PATH_CHANGED)) {
    return {
      ...state,
      table: {
        doc: state.table.doc,
        editParams: state.table.editParams,
        path: action.path,
        types: action.types,
      },
    };
  }
  // When a fresh page or refresh lands, reset the table.
  if (
    isAction(action, DocumentsActionTypes.GET_PAGE_SUCCESS) ||
    isAction(action, DocumentsActionTypes.REFRESH_SUCCESS)
  ) {
    return { ...state, table: INITIAL_TABLE_STATE };
  }
  return state;
};

export function viewChanged(view: DocumentView): ViewChangedAction {
  localStorage.setItem(DOCUMENT_VIEW_STORAGE_KEY, view);
  return { type: ViewActionTypes.VIEW_CHANGED, view };
}

export function drillDown(
  doc: Document,
  element: Element,
  editParams: TableState['editParams'] = null
): DrillDownAction {
  return { type: ViewActionTypes.DRILL_DOWN, doc, element, editParams };
}

export function pathChanged(
  path: (string | number)[],
  types: TableHeaderType[]
): PathChangedAction {
  return { type: ViewActionTypes.PATH_CHANGED, path, types };
}
