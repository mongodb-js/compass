const HadronDocument = require('hadron-document').Document;
const sinon = require('sinon');
const chai = require('chai');
const expect = chai.expect;
const ObjectId = require('bson').ObjectId;

const NUM_DOCS = 20;
const expectedDocs = [];
for (let i = 0; i < 60; i++ ) {
  expectedDocs.push({_id: new ObjectId(), x: i.toString()});
}

const getApi = function() {
  return {
    selectAll: sinon.spy(),
    startEditingCell: sinon.spy(),
    stopEditing: sinon.spy(),
    refreshHeader: sinon.spy(),
    refreshCells: sinon.spy()
  };
};

const getActions = function() {
  return {
    addColumn: sinon.spy(),
    removeColumn: sinon.spy(),
    renameColumn: sinon.spy(),
    replaceDoc: sinon.spy(),
    cleanCols: sinon.spy(),
    resetHeaders: sinon.spy(),
    elementAdded: sinon.spy(),
    elementRemoved: sinon.spy(),
    elementMarkRemoved: sinon.spy(),
    elementTypeChanged: sinon.spy(),
    removeDocument: sinon.spy(),
    replaceDocument: sinon.spy(),
    updateDocument: sinon.spy(),
    getPage: sinon.spy(),
    pathChanged: sinon.spy(),
    drillDown: sinon.spy()
  };
};

const getRowNode = function(doc, id) {
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
      rowNumber: 0
    },
    childIndex: 2
  };
};

const getColumn = function(colId, colDef) {
  return {
    getColId: () => { return colId; },
    getColDef: () => { return colDef; }
  };
};

const getColumnApi = function(columns) {
  return {
    getAllColumns: () => { return columns; },
    getColumn: (index) => { return index in columns ? columns[index] : null; }
  };
};

const getContext = function(path) {
  return {
    path: path,
    removeFooter: sinon.spy(),
    handleUpdate: sinon.spy(),
    handleRemove: sinon.spy(),
    addFooter: sinon.spy(),
    handleClone: sinon.spy(),
    handleCopy: sinon.spy()
  };
};

const getDataService = function(done) {
  const foarSpy = sinon.spy();
  const foauSpy = sinon.spy();
  const iSpy = sinon.spy();
  const dSpy = sinon.spy();
  return {
    foarSpy: foarSpy,
    findOneAndReplace: (ns, filter, obj, prefs, handleResult) => {
      foarSpy(filter, obj);
      handleResult(null, obj);
      done();
    },
    foauSpy: foauSpy,
    findOneAndUpdate: (ns, filter, obj, prefs, handleResult) => {
      foauSpy(filter, obj);
      handleResult(null, obj);
      done();
    },
    iSpy: iSpy,
    insertOne: (ns, obj, prefs, handleResult) => {
      iSpy(obj);
      handleResult(null);
      done();
    },
    dSpy: dSpy,
    deleteOne: (ns, filter, prefs, handleResult) => {
      dSpy(filter);
      handleResult(null, 1);
      done();
    }
  };
};

const checkPageRange = function(error, documents, start, end, page, expectedPage, skip, limit) {
  expect(error).to.equal(null);
  expect(page).to.equal(expectedPage);

  const startingDocument = (NUM_DOCS * page) + skip;

  let nextPageSize = NUM_DOCS;

  if (startingDocument + nextPageSize > expectedDocs.length) {
    nextPageSize = expectedDocs.length - startingDocument;
  }
  if (limit !== 0 && limit < expectedDocs.length && startingDocument + nextPageSize > limit) {
    nextPageSize = limit - (NUM_DOCS * page);
  }

  expect(documents.length).to.equal(nextPageSize);
  // expect(documents[0].generateObject()).to.deep.equal(expectedDocs[startingDocument]);
  // expect(documents[nextPageSize - 1].generateObject()).to.deep.equal(expectedDocs[endingDocument - 1]);

  /* 1-indexed */
  expect(start).to.equal((NUM_DOCS * page) + 1);
  expect(end).to.equal((NUM_DOCS * page) + nextPageSize);
};

const notCalledExcept = function(spies, except) {
  for (const action in spies) {
    if (except.indexOf(action) < 0 && action !== 'selectAll' && action !== 'path') {
      expect(spies[action].called).to.equal(false, action + ' called but should not be');
    }
  }
};

module.exports = {
  getNode: getRowNode,
  getApi: getApi,
  getColumn: getColumn,
  getActions: getActions,
  getColumnApi: getColumnApi,
  getContext: getContext,
  getDataService: getDataService,
  notCalledExcept: notCalledExcept,
  NUM_DOCS: NUM_DOCS,
  expectedDocs: expectedDocs,
  checkPageRange: checkPageRange
};
