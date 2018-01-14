const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
const { Element } = require('hadron-document');
const CRUDStore = require('../../../lib/stores/crud-store');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('CRUDStore', () => {
  const dataService = new DataService(CONNECTION);

  before((done) => {
    global.hadronApp.appRegistry = new AppRegistry();
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

  afterEach(() => {
    CRUDStore.setState(CRUDStore.getInitialState());
  });

  describe('#getInitialState', () => {
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

    it('sets the default insert error', () => {
      expect(CRUDStore.state.insert.error).to.equal(null);
    });

    it('sets the default insert open status', () => {
      expect(CRUDStore.state.insert.isOpen).to.equal(false);
    });
  });

  describe('#onCollectionChanged', () => {
    beforeEach(() => {
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

      CRUDStore.onCollectionChanged('compass-crud.another');
    });
  });

  describe('#emit collection-changed', () => {
    beforeEach(() => {
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
    const query = {
      ns: 'compass-crud.test',
      filter: { name: 'test' },
      sort: { name: 1 },
      limit: 10,
      skip: 5,
      project: { name: 1 }
    };

    it('tiggers with the reset documents', (done) => {
      const unsubscribe = CRUDStore.listen((state) => {
        expect(state.error).to.equal(null);
        expect(state.docs).to.deep.equal([]);
        expect(state.count).to.equal(0);
        unsubscribe();
        done();
      });

      CRUDStore.onQueryChanged(query);
    });
  });

  describe('#insertDocument', () => {
    beforeEach(() => {
      CRUDStore.state.ns = 'compass-crud.test';
    });

    context('when there is no error', () => {
      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the document matches the filter', () => {
        const doc = { name: 'testing' };

        it('inserts the document', (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            expect(state.docs.length).to.equal(1);
            expect(state.count).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.error).to.equal(null);
            unsubscribe();
            done();
          });

          CRUDStore.insertDocument(doc);
        });
      });

      context('when the document does not match the filter', () => {
        const doc = { name: 'testing' };
        beforeEach(() => {
          CRUDStore.state.query.filter = { name: 'something' };
        });


        it('inserts the document but does not add to the list', (done) => {
          const unsubscribe = CRUDStore.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.error).to.equal(null);
            unsubscribe();
            done();
          });

          CRUDStore.insertDocument(doc);
        });
      });
    });

    context('when there is an error', () => {
      const doc = { name: 'testing' };

      it('does not insert the document', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.docs.length).to.equal(1);
          expect(state.count).to.equal(1);
          expect(state.insert.doc).to.equal(null);
          expect(state.insert.isOpen).to.equal(false);
          expect(state.insert.error).to.equal(null);
          unsubscribe();
          done();
        });

        CRUDStore.insertDocument(doc);
      });
    });
  });

  describe('#openInsertDocumentDialog', () => {
    const doc = { _id: 1, name: 'test' };

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

  describe('#resetDocuments', () => {
    beforeEach((done) => {
      dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
    });

    afterEach((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no error', () => {
      before(() => {
        CRUDStore.state.ns = 'compass-crud.test';
      });

      it('resets the documents to the first page', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.have.length(1);
          expect(state.count).to.equal(1);
          unsubscribe();
          done();
        });

        CRUDStore.resetDocuments();
      });
    });

    context('when there is an error', () => {
      before(() => {
        CRUDStore.state.ns = 'compass-crud.test';
        CRUDStore.state.query.filter = { '$iamnotanoperator': 1 };
      });

      it('resets the documents to the first page', (done) => {
        const unsubscribe = CRUDStore.listen((state) => {
          expect(state.error).to.not.equal(null);
          expect(state.docs).to.have.length(0);
          expect(state.count).to.equal(0);
          unsubscribe();
          done();
        });

        CRUDStore.resetDocuments();
      });
    });
  });
});
