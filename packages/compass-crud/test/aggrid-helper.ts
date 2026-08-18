import HadronDocument from 'hadron-document';
import sinon from 'sinon';
import { expect } from 'chai';
import { ObjectId } from 'bson';
import type { Column, ColDef, ColumnApi, GridApi } from 'ag-grid-community';
import type { DocumentTableRowNode } from '../src/components/table-view/cell-editor';
import type { GridContext } from '../src/components/table-view/document-table-view';

export const NUM_DOCS = 20;
export const expectedDocs: any[] = [];
for (let i = 0; i < 60; i++) {
  expectedDocs.push({ _id: new ObjectId(), x: i.toString() });
}

export const getApi = function () {
  const api = {
    selectAll: sinon.spy(),
    startEditingCell: sinon.spy(),
    stopEditing: sinon.spy(),
    refreshHeader: sinon.spy(),
    refreshCells: sinon.spy(),
  };
  return api as typeof api & GridApi;
};

export const getActions = function () {
  return {
    addColumn: sinon.spy(),
    removeColumn: sinon.spy(),
    renameColumn: sinon.spy(),
    replaceDoc: sinon.spy(),
    cleanCols: sinon.spy(),
    resetColumns: sinon.spy(),
    elementAdded: sinon.spy(),
    elementRemoved: sinon.spy(),
    elementMarkRemoved: sinon.spy(),
    elementTypeChanged: sinon.spy(),
    removeDocument: sinon.spy(),
    replaceDocument: sinon.spy(),
    updateDocument: sinon.spy(),
    getPage: sinon.spy(),
    pathChanged: sinon.spy(),
    drillDown: sinon.spy(),
  };
};

export const getRowNode = function (doc: any, id: any = '1') {
  doc._id = id;
  const node = {
    data: {
      hadronDocument: new HadronDocument(doc),
      isFooter: false,
      hasFooter: false,
      state: undefined as DocumentTableRowNode['data']['state'],
      rowNumber: 0,
    },
    childIndex: 2,
  };
  return node as typeof node & DocumentTableRowNode;
};
export const getNode = getRowNode;

export const getColumn = function (colId?: string | number, colDef?: ColDef) {
  const column = {
    getColId: () => {
      return colId;
    },
    getColDef: () => {
      return colDef;
    },
  };
  return column as typeof column & Column;
};

export const getColumnApi = function (columns: Column[]) {
  const columnApi = {
    getAllColumns: () => {
      return columns;
    },
    getColumn: (index: string | number | Column) => {
      return (index as number) in columns ? columns[index as number] : null;
    },
  };
  return columnApi as typeof columnApi & ColumnApi;
};

export const getContext = function (path: (string | number)[]) {
  const context = {
    path: path,
    removeFooter: sinon.spy(),
    handleUpdate: sinon.spy(),
    handleRemove: sinon.spy(),
    addFooter: sinon.spy(),
    handleClone: sinon.spy(),
    handleCopy: sinon.spy(),
  };
  return context as typeof context & GridContext;
};

export const checkPageRange = function (
  error: any,
  documents: any[],
  start: number,
  end: number,
  page: number,
  expectedPage: number,
  skip: number,
  limit: number
) {
  expect(error).to.equal(null);
  expect(page).to.equal(expectedPage);

  const startingDocument = NUM_DOCS * page + skip;

  let nextPageSize = NUM_DOCS;

  if (startingDocument + nextPageSize > expectedDocs.length) {
    nextPageSize = expectedDocs.length - startingDocument;
  }
  if (
    limit !== 0 &&
    limit < expectedDocs.length &&
    startingDocument + nextPageSize > limit
  ) {
    nextPageSize = limit - NUM_DOCS * page;
  }

  expect(documents.length).to.equal(nextPageSize);
  // expect(documents[0].generateObject()).to.deep.equal(expectedDocs[startingDocument]);
  // expect(documents[nextPageSize - 1].generateObject()).to.deep.equal(expectedDocs[endingDocument - 1]);

  /* 1-indexed */
  expect(start).to.equal(NUM_DOCS * page + 1);
  expect(end).to.equal(NUM_DOCS * page + nextPageSize);
};

export const notCalledExcept = function (spies: object, except: string[]) {
  for (const [action, spy] of Object.entries(spies)) {
    if (
      except.indexOf(action) < 0 &&
      action !== 'selectAll' &&
      action !== 'path'
    ) {
      expect((spy as sinon.SinonSpy).called).to.equal(
        false,
        action + ' called but should not be'
      );
    }
  }
};

export default {
  getNode: getRowNode,
  getApi: getApi,
  getColumn: getColumn,
  getActions: getActions,
  getColumnApi: getColumnApi,
  getContext: getContext,
  notCalledExcept: notCalledExcept,
  NUM_DOCS: NUM_DOCS,
  expectedDocs: expectedDocs,
  checkPageRange: checkPageRange,
} as any;
