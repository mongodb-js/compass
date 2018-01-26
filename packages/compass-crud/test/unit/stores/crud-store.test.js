const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
const HadronDocument = require('hadron-document');
const sinon = require('sinon');
const Element = HadronDocument.Element;
const { expectedDocs, checkPageRange, NUM_DOCS } = require('../../aggrid-helper');
const CRUDStore = require('../../../lib/stores/crud-store');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('CRUDStore', () => {
  const dataService = new DataService(CONNECTION);
  const collectionStore = {
    isReadonly: () => {
      return false;
    }
  };
  const appRegistry = new AppRegistry();

  before((done) => {
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('App.CollectionStore', collectionStore);
    global.hadronApp.appRegistry.registerStore('CRUD.Store', CRUDStore);
    global.hadronApp.appRegistry.onActivated();
    dataService.connect(() => {
      global.hadronApp.appRegistry.emit('data-service-connected', null, dataService);
      done();
    });
  });

  after(() => {
    dataService.disconnect();
    global.hadronApp.appRegistry = undefined;
  });

  describe('#getInitialState', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    it('sets the default filter', () => {
      expect(CRUDStore.state.query.filter).to.deep.equal({});
    });

    it('sets the default sort', () => {
      expect(CRUDStore.state.query.sort).to.deep.equal([[ '_id', 1 ]]);
    });

    it('sets the default limit', () => {
      expect(CRUDStore.state.query.limit).to.equal(0);
    });

    it('sets the default skip', () => {
      expect(CRUDStore.state.query.skip).to.equal(0);
    });

    it('sets the default project', () => {
      expect(CRUDStore.state.query.project).to.equal(null);
    });

    it('sets the default namespace', () => {
      expect(CRUDStore.state.ns).to.equal('');
    });

    it('sets the default error', () => {
      expect(CRUDStore.state.error).to.equal(null);
    });

    it('sets the default documents', () => {
      expect(CRUDStore.state.docs).to.deep.equal([]);
    });

    it('sets the default count', () => {
      expect(CRUDStore.state.count).to.equal(0);
    });

    it('sets the default table doc', () => {
      expect(CRUDStore.state.table.doc).to.equal(null);
    });

    it('sets the default table path', () => {
      expect(CRUDStore.state.table.path).to.deep.equal([]);
    });

    it('sets the default table types', () => {
      expect(CRUDStore.state.table.types).to.deep.equal([]);
    });

    it('sets the default table edit params', () => {
      expect(CRUDStore.state.table.editParams).to.equal(null);
    });

    it('sets the default insert doc', () => {
      expect(CRUDStore.state.insert.doc).to.equal(null);
    });

    it('sets the default insert message', () => {
      expect(CRUDStore.state.insert.message).to.equal('');
    });

    it('sets the default insert mode', () => {
      expect(CRUDStore.state.insert.mode).to.equal('modifying');
    });

    it('sets the default insert open status', () => {
      expect(CRUDStore.state.insert.isOpen).to.equal(false);
    });

    it('sets the default isEditable status', () => {
      expect(CRUDStore.state.isEditable).to.equal(true);
    });

    it('sets the default view', () => {
      expect(CRUDStore.state.view).to.equal('List');
    });
  });

  describe('#onCollectionChanged', () => {
    context('when the collection is not readonly', () => {
      beforeEach(() => {
        CRUDStore.state = CRUDStore.getInitialState();
        CRUDStore.state.table.path = [ 'test-path' ];
        CRUDStore.state.table.types = [ 'test-types' ];
        CRUDStore.state.table.doc = {};
        CRUDStore.state.table.editParams = {};
      });

      it('resets the state for the new editable collection', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(true);
          expect(state.ns).to.equal('compass-crud.another');
          unsubscribe();
          done();
        });

        CRUDStore.onCollectionChanged('compass-crud.another');
      });
    });

    context('when the collection is readonly', () => {
      beforeEach(() => {
        collectionStore.isReadonly = () => {
          return true;
        };

        CRUDStore.state = CRUDStore.getInitialState();
        CRUDStore.state.table.path = [ 'test-path' ];
        CRUDStore.state.table.types = [ 'test-types' ];
        CRUDStore.state.table.doc = {};
        CRUDStore.state.table.editParams = {};
      });

      afterEach(() => {
        collectionStore.isReadonly = () => {
          return false;
        };
      });

      it('resets the state for the new readonly collection', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(false);
          expect(state.ns).to.equal('compass-crud.another');
          unsubscribe();
          done();
        });

        CRUDStore.onCollectionChanged('compass-crud.another');
      });
    });

    context('when running in a readonly context', () => {
      beforeEach(() => {
        process.env.HADRON_READONLY = 'true';
        CRUDStore.state = CRUDStore.getInitialState();
        CRUDStore.state.table.path = [ 'test-path' ];
        CRUDStore.state.table.types = [ 'test-types' ];
        CRUDStore.state.table.doc = {};
        CRUDStore.state.table.editParams = {};
      });

      afterEach(() => {
        process.env.HADRON_READONLY = 'false';
      });

      it('resets the state for the new readonly collection', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(false);
          expect(state.ns).to.equal('compass-crud.another');
          unsubscribe();
          done();
        });

        CRUDStore.onCollectionChanged('compass-crud.another');
      });
    });
  });

  describe('#emit collection-changed', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.table.path = [ 'test-path' ];
      CRUDStore.state.table.types = [ 'test-types' ];
      CRUDStore.state.table.doc = {};
      CRUDStore.state.table.editParams = {};
    });

    it('resets the state for the new collection', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.table.path).to.deep.equal([]);
        expect(state.table.types).to.deep.equal([]);
        expect(state.table.doc).to.equal(null);
        expect(state.table.editParams).to.equal(null);
        expect(state.collection).to.equal('another');
        expect(state.ns).to.equal('compass-crud.another');
        unsubscribe();
        done();
      });

      global.hadronApp.appRegistry.emit('collection-changed', 'compass-crud.another');
    });
  });

  describe('#onQueryChanged', () => {
    context('when a project is present', () => {
      const query = {
        ns: 'compass-crud.test',
        filter: { name: 'test' },
        sort: { name: 1 },
        limit: 10,
        skip: 5,
        project: { name: 1 }
      };

      beforeEach(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      it('tiggers with the reset documents and isEditable false', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.deep.equal([]);
          expect(state.count).to.equal(0);
          expect(state.isEditable).to.equal(false);
          unsubscribe();
          done();
        });

        CRUDStore.onQueryChanged(query);
      });
    });

    context('when a project is not present', () => {
      const query = {
        ns: 'compass-crud.test',
        filter: { name: 'test' },
        sort: { name: 1 },
        limit: 10,
        skip: 5
      };

      beforeEach(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      it('tiggers with the reset documents with isEditable true', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.deep.equal([]);
          expect(state.count).to.equal(0);
          expect(state.isEditable).to.equal(true);
          unsubscribe();
          done();
        });

        CRUDStore.onQueryChanged(query);
      });
    });
  });

  describe('#openExport', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.ns = 'compass-crud.test';
      CRUDStore.state.query = {
        filter: { name: 'testing' }
      };
    });

    it('emits the event on the app registry with the ns and query', (done) => {
      appRegistry.on('open-export', (ns, query) => {
        expect(ns).to.equal(CRUDStore.state.ns);
        expect(query).to.deep.equal(CRUDStore.state.query);
        done();
      });

      CRUDStore.openExport();
    });
  });

  describe('#openImport', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.ns = 'compass-crud.test';
    });

    it('emits the event on the app registry with the ns', (done) => {
      appRegistry.on('open-import', (ns) => {
        expect(ns).to.equal(CRUDStore.state.ns);
        done();
      });

      CRUDStore.openImport();
    });
  });

  describe('#removeDocument', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.ns = 'compass-crud.test';
    });

    context('when there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        CRUDStore.state.docs = [ hadronDoc ];
        CRUDStore.state.count = 1;
        CRUDStore.state.end = 1;
      });

      it('deletes the document from the collection', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.end).to.equal(0);
          unsubscribe();
          done();
        });

        CRUDStore.removeDocument(hadronDoc);
      });
    });

    context('when the deletion errors', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        stub = sinon.stub(dataService, 'deleteOne').yields({ message: 'error happened' });
      });

      afterEach(() => {
        stub.restore();
      });

      it('sets the error for the document', (done) => {
        hadronDoc.on('remove-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        CRUDStore.removeDocument(hadronDoc);
      });
    });
  });

  describe('#updateDocument', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.ns = 'compass-crud.test';
    });

    context('when there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        CRUDStore.state.docs = [ hadronDoc ];
      });

      it('replaces the document in the list', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          unsubscribe();
          done();
        });

        CRUDStore.updateDocument(hadronDoc);
      });
    });

    context('when the update errors', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        stub = sinon.stub(dataService, 'findOneAndReplace').yields({ message: 'error happened' });
      });

      afterEach(() => {
        stub.restore();
      });

      it('sets the error for the document', (done) => {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        CRUDStore.updateDocument(hadronDoc);
      });
    });
  });

  describe('#insertDocument', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
      CRUDStore.state.ns = 'compass-crud.test';
    });

    context('when there is no error', () => {
      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the document matches the filter', () => {
        const doc = new HadronDocument({ name: 'testing' });

        it('inserts the document', (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            expect(state.docs.length).to.equal(1);
            expect(state.count).to.equal(1);
            expect(state.end).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          CRUDStore.insertDocument(doc);
        });
      });

      context('when the document does not match the filter', () => {
        const doc = new HadronDocument({ name: 'testing' });

        beforeEach(() => {
          CRUDStore.state.query.filter = { name: 'something' };
        });


        it('inserts the document but does not add to the list', (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          CRUDStore.insertDocument(doc);
        });
      });
    });

    context('when there is an error', () => {
      const doc = new HadronDocument({ '$name': 'testing' });

      beforeEach(() => {
        CRUDStore.state.insert.doc = doc;
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('does not insert the document', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.insert.doc).to.not.equal(null);
          expect(state.insert.isOpen).to.equal(true);
          expect(state.insert.message).to.not.equal('');
          unsubscribe();
          done();
        });

        CRUDStore.insertDocument(doc);
      });
    });
  });

  describe('#openInsertDocumentDialog', () => {
    const doc = { _id: 1, name: 'test' };

    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    context('when clone is true', () => {
      it('removes _id from the document', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('name');
          unsubscribe();
          done();
        });

        CRUDStore.openInsertDocumentDialog(doc, true);
      });
    });

    context('when clone is false', () => {
      it('does not remove _id from the document', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('_id');
          unsubscribe();
          done();
        });

        CRUDStore.openInsertDocumentDialog(doc, false);
      });
    });
  });

  describe('#emit query-changed', () => {
    const query = {
      ns: 'compass-crud.test',
      filter: { name: 'test' },
      sort: { name: 1 },
      limit: 10,
      skip: 5,
      project: { name: 1 }
    };

    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    it('tiggers with the reset documents', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.error).to.equal(null);
        expect(state.docs).to.deep.equal([]);
        expect(state.count).to.equal(0);
        unsubscribe();
        done();
      });

      global.hadronApp.appRegistry.emit('query-changed', query);
    });
  });

  describe('#drillDown', () => {
    const doc = { field4: 'value' };
    const element = new Element('field3', 'value');
    const editParams = { colId: 1, rowIndex: 0 };

    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    it('sets the drill down state', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.table.doc).to.deep.equal(doc);
        expect(state.table.path).to.deep.equal([ 'field3' ]);
        expect(state.table.types).to.deep.equal([ 'String' ]);
        expect(state.table.editParams).to.deep.equal(editParams);
        unsubscribe();
        done();
      });

      CRUDStore.drillDown(doc, element, editParams);
    });
  });

  describe('#pathChanged', () => {
    const path = ['field1', 'field2'];
    const types = ['Object', 'Array'];

    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    it('sets the path and types state', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.table.path).to.deep.equal(path);
        expect(state.table.types).to.deep.equal(types);
        unsubscribe();
        done();
      });

      CRUDStore.pathChanged(path, types);
    });
  });

  describe('#viewChanged', () => {
    beforeEach(() => {
      CRUDStore.state = CRUDStore.getInitialState();
    });

    it('sets the view', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.view).to.equal('Table');
        unsubscribe();
        done();
      });

      CRUDStore.viewChanged('Table');
    });
  });

  describe('#refreshDocuments', () => {
    beforeEach((done) => {
      CRUDStore.state = CRUDStore.getInitialState();
      dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
    });

    afterEach((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no error', () => {
      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
      });

      it('resets the documents to the first page', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.have.length(1);
          expect(state.count).to.equal(1);
          expect(state.start).to.equal(1);
          unsubscribe();
          done();
        });

        CRUDStore.refreshDocuments();
      });
    });

    context('when there is an error', () => {
      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.filter = { '$iamnotanoperator': 1 };
      });

      it('resets the documents to the first page', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.not.equal(null);
          expect(state.docs).to.have.length(0);
          expect(state.count).to.equal(0);
          expect(state.start).to.equal(0);
          unsubscribe();
          done();
        });

        CRUDStore.refreshDocuments();
      });
    });
  });

  describe('#getNextPage/#getPrevPage', () => {
    before((done) => {
      CRUDStore.state.ns = 'compass-crud.test';
      dataService.insertMany('compass-crud.test', expectedDocs, {}, done);
    });

    after((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no skip or limit', () => {
      before(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
      });

      /* Don't test getNextPage(0) because not possible */
      for (let i = 1; i < 3; i++) {
        it('gets the next page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, 0, 0);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getNextPage(i);
        });
      }

      for (let i = 1; i >= 0; i--) {
        it('gets the prev page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, 0, 0);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getPrevPage(i);
        });
      }
    });

    context('when there is a skip', () => {
      const skip = 5;

      before(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.skip = skip;
      });

      for (let i = 1; i < 3; i++) {
        it('gets the next page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, skip, 0);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getNextPage(i);
        });
      }

      for (let i = 1; i >= 0; i--) {
        it('gets the prev page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, skip, 0);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getPrevPage(i);
        });
      }
    });

    context('when there is a limit', () => {
      const limit = 50;

      before(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.limit = limit;
      });

      for (let i = 1; i < 3; i++) {
        it('gets the next page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, 0, limit);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getNextPage(i);
        });
      }

      for (let i = 1; i >= 0; i--) {
        it('gets the prev page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, 0, limit);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getPrevPage(i);
        });
      }
    });

    context('when there is a skip and limit', () => {
      const limit = 50;
      const skip = 2;

      before(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.limit = limit;
        CRUDStore.state.query.skip = skip;
      });

      for (let i = 1; i < 3; i++) {
        it('gets the next page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, skip, limit);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getNextPage(i);
        });
      }

      for (let i = 1; i >= 0; i--) {
        it('gets the prev page for ' + i, (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            unsubscribe();
            checkPageRange(state.error, state.docs, state.start, state.end, state.page, i, skip, limit);
            expect(state.counter).to.equal(NUM_DOCS * i);
            done();
          });
          CRUDStore.getPrevPage(i);
        });
      }
    });

    context('when skipping around pages', () => {
      const limit = 55;
      const skip = 3;

      before(() => {
        CRUDStore.state = CRUDStore.getInitialState();
      });

      beforeEach(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.limit = limit;
        CRUDStore.state.query.skip = skip;
      });

      it('next to page 1', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          unsubscribe();
          checkPageRange(state.error, state.docs, state.start, state.end, state.page, 1, skip, limit);
          expect(state.counter).to.equal(NUM_DOCS);
          done();
        });
        CRUDStore.getNextPage(1);
      });

      it('prev to page 0', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          unsubscribe();
          checkPageRange(state.error, state.docs, state.start, state.end, state.page, 0, skip, limit);
          expect(state.counter).to.equal(0);
          done();
        });
        CRUDStore.getPrevPage(0);
      });

      it('next to page 1', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          unsubscribe();
          checkPageRange(state.error, state.docs, state.start, state.end, state.page, 1, skip, limit);
          expect(state.counter).to.equal(NUM_DOCS);
          done();
        });
        CRUDStore.getNextPage(1);
      });

      it('next to page 2', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          unsubscribe();
          checkPageRange(state.error, state.docs, state.start, state.end, state.page, 2, skip, limit);
          expect(state.counter).to.equal(NUM_DOCS * 2);
          done();
        });
        CRUDStore.getNextPage(2);
      });

      it('prev to page 1', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          unsubscribe();
          checkPageRange(state.error, state.docs, state.start, state.end, state.page, 1, skip, limit);
          expect(state.counter).to.equal(NUM_DOCS);
          done();
        });
        CRUDStore.getPrevPage(1);
      });
    });
  });
});
