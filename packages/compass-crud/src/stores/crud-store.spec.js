import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
import HadronDocument, { Element } from 'hadron-document';
import configureStore from 'stores/crud-store';
import configureActions from 'actions';

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('store', () => {
  const dataService = new DataService(CONNECTION);
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();

  before((done) => {
    dataService.connect(() => {
      done();
    });
  });

  after((done) => {
    dataService.disconnect(done);
  });

  describe('#getInitialState', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        actions: actions,
        dataProvider: {
          error: null,
          dataProvider: dataService
        }
      });
    });

    it('sets the default filter', () => {
      expect(store.state.query.filter).to.deep.equal({});
    });

    it('sets the default sort', () => {
      expect(store.state.query.sort).to.deep.equal([[ '_id', 1 ]]);
    });

    it('sets the default limit', () => {
      expect(store.state.query.limit).to.equal(0);
    });

    it('sets the default skip', () => {
      expect(store.state.query.skip).to.equal(0);
    });

    it('sets the default project', () => {
      expect(store.state.query.project).to.equal(null);
    });

    it('sets the default collation', () => {
      expect(store.state.query.collation).to.equal(null);
    });

    it('sets the default namespace', () => {
      expect(store.state.ns).to.equal('');
    });

    it('sets the default error', () => {
      expect(store.state.error).to.equal(null);
    });

    it('sets the default documents', () => {
      expect(store.state.docs).to.deep.equal([]);
    });

    it('sets the default count', () => {
      expect(store.state.count).to.equal(0);
    });

    it('sets the default table doc', () => {
      expect(store.state.table.doc).to.equal(null);
    });

    it('sets the default table path', () => {
      expect(store.state.table.path).to.deep.equal([]);
    });

    it('sets the default table types', () => {
      expect(store.state.table.types).to.deep.equal([]);
    });

    it('sets the default table edit params', () => {
      expect(store.state.table.editParams).to.equal(null);
    });

    it('sets the default insert doc', () => {
      expect(store.state.insert.doc).to.equal(null);
    });

    it('sets the default insert json doc', () => {
      expect(store.state.insert.jsonDoc).to.equal(null);
    });

    it('sets the default insert json view', () => {
      expect(store.state.insert.jsonView).to.equal(false);
    });

    it('sets the default insert message', () => {
      expect(store.state.insert.message).to.equal('');
    });

    it('sets the default insert mode', () => {
      expect(store.state.insert.mode).to.equal('modifying');
    });

    it('sets the default insert json view', () => {
      expect(store.state.insert.jsonView).to.equal(false);
    });

    it('sets the default insert open status', () => {
      expect(store.state.insert.isOpen).to.equal(false);
    });

    it('sets the default isEditable status', () => {
      expect(store.state.isEditable).to.equal(true);
    });

    it('sets the default view', () => {
      expect(store.state.view).to.equal('List');
    });
  });

  describe('#onCollectionChanged', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions
      });
    });

    context('when the collection is not readonly', () => {
      beforeEach(() => {
        store.state.table.path = [ 'test-path' ];
        store.state.table.types = [ 'test-types' ];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      it('resets the state for the new editable collection', (done) => {
        const unsubscribe = store.listen((state) => {
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

        store.onCollectionChanged('compass-crud.another');
      });
    });

    context('when the collection is readonly', () => {
      beforeEach(() => {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService
          },
          actions: actions,
          isReadonly: true
        });
        store.state.table.path = [ 'test-path' ];
        store.state.table.types = [ 'test-types' ];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      it('resets the state for the new readonly collection', (done) => {
        const unsubscribe = store.listen((state) => {
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

        store.onCollectionChanged('compass-crud.another');
      });
    });

    context('when running in a readonly context', () => {
      beforeEach(() => {
        process.env.HADRON_READONLY = 'true';
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService
          },
          actions: actions
        });
        store.state.table.path = [ 'test-path' ];
        store.state.table.types = [ 'test-types' ];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      afterEach(() => {
        process.env.HADRON_READONLY = 'false';
      });

      it('resets the state for the new readonly collection', (done) => {
        const unsubscribe = store.listen((state) => {
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

        store.onCollectionChanged('compass-crud.another');
      });
    });
  });

  describe('#onQueryChanged', () => {
    context('when a project is present', () => {
      let store;
      let actions;

      beforeEach(() => {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService
          },
          actions: actions,
          namespace: 'compass-crud.test'
        });
      });

      const query = {
        filter: { name: 'test' },
        sort: { name: 1 },
        collation: { locale: 'simple' },
        limit: 10,
        skip: 5,
        project: { name: 1 }
      };

      it('tiggers with the reset documents and isEditable false', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.deep.equal([]);
          expect(state.count).to.equal(0);
          expect(state.isEditable).to.equal(false);
          unsubscribe();
          done();
        });

        store.onQueryChanged(query);
      });
    });

    context('when a project is not present', () => {
      let store;
      let actions;

      beforeEach(() => {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService
          },
          actions: actions,
          namespace: 'compass-crud.test'
        });
      });

      const query = {
        filter: { name: 'test' },
        sort: { name: 1 },
        collation: { locale: 'simple' },
        limit: 10,
        skip: 5
      };

      it('tiggers with the reset documents with isEditable true', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.deep.equal([]);
          expect(state.count).to.equal(0);
          expect(state.isEditable).to.equal(true);
          unsubscribe();
          done();
        });

        store.onQueryChanged(query);
      });
    });
  });

  describe('#removeDocument', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    context('when there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
        store.state.count = 1;
        store.state.end = 1;
      });

      it('deletes the document from the collection', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.end).to.equal(0);
          unsubscribe();
          done();
        });

        store.removeDocument(hadronDoc);
      });
    });

    context('when the _id is null', () => {
      const doc = { _id: null, name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
        store.state.count = 1;
        store.state.end = 1;
      });

      it('deletes the document from the collection', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.end).to.equal(0);
          unsubscribe();
          done();
        });

        store.removeDocument(hadronDoc);
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

        store.removeDocument(hadronDoc);
      });
    });
  });

  describe('#updateDocument', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    context('when there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
      });

      it('replaces the document in the list', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          unsubscribe();
          done();
        });

        store.updateDocument(hadronDoc);
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

        store.updateDocument(hadronDoc);
      });
    });
  });

  describe('#insertOneDocument', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    context('when there is no error', () => {
      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the document matches the filter', () => {
        const doc = new HadronDocument({ name: 'testing' });

        it('inserts the document', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(1);
            expect(state.count).to.equal(1);
            expect(state.end).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          store.state.insert.doc = doc;
          store.insertDocument();
        });
      });

      context('when the document does not match the filter', () => {
        const doc = new HadronDocument({ name: 'testing' });

        beforeEach(() => {
          store.state.query.filter = { name: 'something' };
        });


        it('inserts the document but does not add to the list', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          store.state.insert.doc = doc;
          store.insertDocument();
        });
      });
    });

    context('when there is an error', () => {
      const doc = new HadronDocument({ '$name': 'testing' });

      beforeEach(() => {
        store.state.insert.doc = doc;
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('does not insert the document', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.insert.doc).to.not.equal(null);
          expect(state.insert.jsonDoc).to.not.equal(null);
          expect(state.insert.isOpen).to.equal(true);
          expect(state.insert.jsonView).to.equal(false);
          expect(state.insert.message).to.not.equal('');
          unsubscribe();
          done();
        });

        store.state.insert.doc = doc;
        store.insertDocument();
      });
    });
  });

  describe('#insertManyDocuments', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    context('when there is no error', () => {
      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the documents match the filter', () => {
        const docs = '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        it('inserts the document', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(2);
            expect(state.count).to.equal(2);
            expect(state.end).to.equal(2);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          store.state.insert.jsonDoc = docs;
          store.insertMany();
        });
      });

      context('when none of the documents match the filter', () => {
        const docs = '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        beforeEach(() => {
          store.state.query.filter = { name: 'something' };
        });


        it('inserts both documents but does not add to the list', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.end).to.equal(0);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          store.state.insert.jsonDoc = docs;
          store.insertMany();
        });
      });

      context('when only one of the documents match the filter', () => {
        const docs = '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        beforeEach(() => {
          store.state.query.filter = { name: 'Rey' };
        });


        it('inserts both documents but only adds the matching one to the list', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(1);
            expect(state.count).to.equal(1);
            expect(state.end).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
            unsubscribe();
            done();
          });

          store.state.insert.jsonDoc = docs;
          store.insertMany();
        });
      });
    });

    context('when there is an error', () => {
      const docs = '[ { "$name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

      beforeEach(() => {
        store.state.insert.jsonDoc = JSON.stringify(docs);
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('does not insert the document', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.insert.doc).to.not.equal(null);
          expect(state.insert.jsonDoc).to.equal(docs);
          expect(state.insert.isOpen).to.equal(true);
          expect(state.insert.jsonView).to.equal(true);
          expect(state.insert.message).to.equal('key $name must not start with \'$\'');
          unsubscribe();
          done();
        });

        store.state.insert.jsonDoc = docs;
        store.insertMany();
      });
    });
  });


  describe('#openInsertDocumentDialog', () => {
    const doc = { _id: 1, name: 'test' };
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    context('when clone is true', () => {
      it('removes _id from the document', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('name');
          unsubscribe();
          done();
        });

        store.openInsertDocumentDialog(doc, true);
      });
    });

    context('when clone is false', () => {
      it('does not remove _id from the document', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('_id');
          unsubscribe();
          done();
        });

        store.openInsertDocumentDialog(doc, false);
      });
    });
  });

  describe('#drillDown', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    const doc = { field4: 'value' };
    const element = new Element('field3', 'value');
    const editParams = { colId: 1, rowIndex: 0 };

    it('sets the drill down state', (done) => {
      const unsubscribe = store.listen((state) => {
        expect(state.table.doc).to.deep.equal(doc);
        expect(state.table.path).to.deep.equal([ 'field3' ]);
        expect(state.table.types).to.deep.equal([ 'String' ]);
        expect(state.table.editParams).to.deep.equal(editParams);
        unsubscribe();
        done();
      });

      store.drillDown(doc, element, editParams);
    });
  });

  describe('#pathChanged', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    const path = ['field1', 'field2'];
    const types = ['Object', 'Array'];

    it('sets the path and types state', (done) => {
      const unsubscribe = store.listen((state) => {
        expect(state.table.path).to.deep.equal(path);
        expect(state.table.types).to.deep.equal(types);
        unsubscribe();
        done();
      });

      store.pathChanged(path, types);
    });
  });

  describe('#viewChanged', () => {
    let store;
    let actions;

    beforeEach(() => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
    });

    it('sets the view', (done) => {
      const unsubscribe = store.listen((state) => {
        expect(state.view).to.equal('Table');
        unsubscribe();
        done();
      });

      store.viewChanged('Table');
    });
  });

  describe('#refreshDocuments', () => {
    let store;
    let actions;

    beforeEach((done) => {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        actions: actions,
        namespace: 'compass-crud.test'
      });
      dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
    });

    afterEach((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no error', () => {
      it('resets the documents to the first page', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.docs).to.have.length(1);
          expect(state.count).to.equal(1);
          expect(state.start).to.equal(1);
          unsubscribe();
          done();
        });

        store.refreshDocuments();
      });
    });

    context('when there is an error', () => {
      beforeEach(() => {
        store.state.query.filter = { '$iamnotanoperator': 1 };
      });

      it('resets the documents to the first page', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.error).to.not.equal(null);
          expect(state.docs).to.have.length(0);
          expect(state.count).to.equal(null);
          expect(state.start).to.equal(0);
          unsubscribe();
          done();
        });

        store.refreshDocuments();
      });
    });
  });
});
