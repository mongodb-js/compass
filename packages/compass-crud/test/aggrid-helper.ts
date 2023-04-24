import HadronDocument from 'hadron-document';
import sinon from 'sinon';
import { expect } from 'chai';
import { ObjectId } from 'bson';

export const NUM_DOCS = 20;
export const expectedDocs: any[] = [];
for (let i = 0; i < 60; i++) {
  expectedDocs.push({ _id: new ObjectId(), x: i.toString() });
}

export const getApi = function () {
  return {
    selectAll: sinon.spy(),
    startEditingCell: sinon.spy(),
    stopEditing: sinon.spy(),
    refreshHeader: sinon.spy(),
    refreshCells: sinon.spy(),
  };
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

export const getRowNode = function (doc: any, id?: any) {
  if (!id) {
    id = '1';
  }
  doc._id = id;
  return {
    data: {
      hadronDocument: new HadronDocument(doc),
      isFooter: false,
      hasFooter: false,
      state: null,
      rowNumber: 0,
    },
    childIndex: 2,
  };
};
export const getNode = getRowNode;

export const getColumn = function (colId: any, colDef: any) {
  return {
    getColId: () => {
      return colId;
    },
    getColDef: () => {
      return colDef;
    },
  };
};

export const getColumnApi = function (columns: any[]) {
  return {
    getAllColumns: () => {
      return columns;
    },
    getColumn: (index) => {
      return index in columns ? columns[index] : null;
    },
  };
};

export const getContext = function (path) {
  return {
    path: path,
    removeFooter: sinon.spy(),
    handleUpdate: sinon.spy(),
    handleRemove: sinon.spy(),
    addFooter: sinon.spy(),
    handleClone: sinon.spy(),
    handleCopy: sinon.spy(),
  };
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

export const notCalledExcept = function (spies, except) {
  for (const action in spies) {
    if (
      except.indexOf(action) < 0 &&
      action !== 'selectAll' &&
      action !== 'path'
    ) {
      expect(spies[action].called).to.equal(
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
