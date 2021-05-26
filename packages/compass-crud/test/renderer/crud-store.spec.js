import Connection from 'mongodb-connection-model';
import DataService from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
import HadronDocument, { Element } from 'hadron-document';
import configureStore from '../../src/stores/crud-store';
import configureActions from '../../src/actions';
import EJSON from 'mongodb-extended-json';

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin'
});

describe('store', function() {
  this.timeout(5000);
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
        actions: actions
      });
    });

    it('sets the default filter', () => {
      expect(store.state.query.filter).to.deep.equal({});
    });

    it('sets the default sort', () => {
      expect(store.state.query.sort).to.deep.equal(null);
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
        namespace: 'compass-crud.another',
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
          namespace: 'compass-crud.another',
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
          namespace: 'compass-crud.another',
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

    it('resets the state', (done) => {
      const unsubscribe = store.listen((state) => {
        expect(state.error).to.equal(null);
        expect(state.docs).to.deep.equal([]);
        expect(state.count).to.equal(0);
        unsubscribe();
        done();
      });

      store.onQueryChanged(query);
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
      dataService.insertOne('compass-crud.test', {
        _id: 'testing',
        name: 'Depeche Mode'
      }, {}, done);
    });

    afterEach((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
        hadronDoc.elements.at(1).rename('new name');
      });

      it('replaces the document in the list', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          expect(state.docs[0].elements.at(1).key === 'new name');
          unsubscribe();
          setTimeout(() => done(), 100);
        });

        hadronDoc.on('update-blocked', () => {
          done(new Error('Didn\'t expect update to be blocked.'));
        });

        hadronDoc.on('update-error', (errorMessage) => {
          done(new Error(`Didn\'t expect update to error. Errored with message: ${errorMessage}`));
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when a new field is added and there is no error', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
        hadronDoc.insertAfter(hadronDoc.elements.at(1), 'new field', 'new field value');
      });

      it('updates the document in the list', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          expect(state.docs[0].elements.at(2).key === 'new field');
          unsubscribe();
          // Ensure we have enough time for update-blocked or update-error to be called.
          setTimeout(() => done(), 100);
        });

        hadronDoc.on('update-blocked', () => {
          done(new Error('Didn\'t expect update to be blocked.'));
        });

        hadronDoc.on('update-error', (errorMessage) => {
          done(new Error(`Didn\'t expect update to error. Errored with message: ${errorMessage}`));
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when there is no update to make', () => {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields({ message: 'error happened' });
      });

      afterEach(() => {
        stub.restore();
      });

      it('sets the error for the document', (done) => {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('Unable to update, no changes have been made.');
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
        hadronDoc.elements.at(1).rename('new name');
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields({ message: 'error happened' });
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

    context('when the update fails', () => {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        hadronDoc.elements.at(1).rename('new name');
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields(null, null);
      });

      afterEach(() => {
        stub.restore();
      });

      it('sets the update blocked for the document', (done) => {
        hadronDoc.on('update-blocked', () => {
          done();
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when update is called on an edited doc', () => {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields(null, {});
      });

      afterEach(() => {
        stub.restore();
      });

      it('has the original value for the edited value in the query', () => {
        store.updateDocument(hadronDoc);

        expect(stub.getCall(0).args[1]).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand'
        });
        expect(stub.getCall(0).args[2]).to.deep.equal({
          $set: {
            name: 'Desert Sand'
          }
        });
      });
    });

    context('when update is called on an edited doc in sharded collection', () => {
      const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        store.state.shardKeys = { yes: 1 };
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields(null, {});
      });

      afterEach(() => {
        store.state.shardKeys = null;
        stub.restore();
      });

      it('has the shard key in the query', () => {
        store.updateDocument(hadronDoc);

        expect(stub.getCall(0).args[1]).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
          yes: 'no'
        });
        expect(stub.getCall(0).args[2]).to.deep.equal({
          $set: {
            name: 'Desert Sand'
          }
        });
      });
    });

    context('when passed an invalid document', () => {
      it('should emit an error to the state', (done) => {
        const doc = { _id: 'testing', name: 'Beach Sand' };
        const invalidHadronDoc = new HadronDocument(doc);
        invalidHadronDoc.getId = null;

        invalidHadronDoc.on('update-error', (message) => {
          expect(message).to.equal('An error occured when attempting to update the document: doc.getId is not a function');

          done();
        });

        store.updateDocument(invalidHadronDoc);
      });
    });
  });

  describe('#replaceDocument', () => {
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

        store.replaceDocument(hadronDoc);
      });
    });

    context('when the replace errors', () => {
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

        store.replaceDocument(hadronDoc);
      });
    });

    context('when replace is called on an edited doc', () => {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndReplace').yields(null, {});
      });

      afterEach(() => {
        stub.restore();
      });

      it('has the original value for the edited value in the query', () => {
        store.replaceDocument(hadronDoc);

        expect(stub.getCall(0).args[2]).to.deep.equal({
          _id: 'testing',
          name: 'Desert Sand'
        });
      });
    });

    context('when update is called on an edited doc in sharded collection', () => {
      const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(() => {
        store.state.shardKeys = { yes: 1 };
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndReplace').yields(null, {});
      });

      afterEach(() => {
        store.state.shardKeys = null;
        stub.restore();
      });

      it('has the shard key in the query', () => {
        store.replaceDocument(hadronDoc);

        expect(stub.getCall(0).args[1]).to.deep.equal({
          _id: 'testing',
          yes: 'no'
        });
        expect(stub.getCall(0).args[2]).to.deep.equal({
          _id: 'testing',
          name: 'Desert Sand',
          yes: 'no'
        });
      });
    });
  });

  describe('#replaceExtJsonDocument', () => {
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
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true
      });
    });

    context('when there is no error', () => {
      const doc = { _id: '591801a468f9e7024b623939', cat: 'Nori' };
      const hadronDoc = new HadronDocument(doc);
      const stringifiedDoc = EJSON.stringify(doc);
      const ejsonDoc = EJSON.parse(stringifiedDoc);

      beforeEach(() => {
        store.state.docs = [ hadronDoc ];
      });

      it('replaces the document in the list', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.updateSuccess).to.equal(true);
          expect(state.docs[0]).to.not.equal(hadronDoc);
          unsubscribe();
          done();
        });

        store.replaceExtJsonDocument(ejsonDoc, hadronDoc);
      });
    });

    context('when the update errors', () => {
      const doc = { _id: '591801a468f9e7024b623939', cat: 'Nori' };
      const hadronDoc = new HadronDocument(doc);
      const stringifiedDoc = EJSON.stringify(doc);
      const ejsonDoc = EJSON.parse(stringifiedDoc);
      let stub;

      beforeEach(() => {
        stub = sinon.stub(dataService, 'findOneAndReplace').yields({ message: 'error happened' });
      });

      afterEach(() => {
        stub.restore();
      });

      it('sets the error for the document', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.updateError).to.equal('error happened');
          unsubscribe();
          done();
        });

        store.replaceExtJsonDocument(ejsonDoc, hadronDoc);
      });
    });

    context('when update is called on an edited doc in sharded collection', () => {
      const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
      const hadronDoc = new HadronDocument(doc);
      const stringifiedDoc = EJSON.stringify(doc);
      const ejsonDoc = EJSON.parse(stringifiedDoc);
      let stub;

      beforeEach(() => {
        store.state.shardKeys = { yes: 1 };
        stub = sinon.stub(dataService, 'findOneAndReplace').yields(null, {});
      });

      afterEach(() => {
        store.state.shardKeys = null;
        stub.restore();
      });

      it('has the shard key in the query', () => {
        store.replaceExtJsonDocument(ejsonDoc, hadronDoc);

        expect(stub.getCall(0).args[1]).to.deep.equal({
          _id: 'testing',
          yes: 'no'
        });
        expect(stub.getCall(0).args[2]).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
          yes: 'no'
        });
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
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true
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
          store.state.insert.doc = doc;
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

          store.insertDocument();
        });
      });
    });

    context('when there is an error', () => {
      context('when it is a json mode', () => {
        const doc = {};
        const jsonDoc = '{ "$name": "testing" }';

        beforeEach(() => {
          store.state.insert.jsonView = true;
          store.state.insert.doc = doc;
          store.state.insert.jsonDoc = jsonDoc;
        });

        afterEach((done) => {
          dataService.deleteMany('compass-crud.test', {}, {}, done);
        });

        it('does not insert the document', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.deep.equal(doc);
            expect(state.insert.jsonDoc).to.equal(jsonDoc);
            expect(state.insert.isOpen).to.equal(true);
            expect(state.insert.jsonView).to.equal(true);
            expect(state.insert.message).to.not.equal('');
            unsubscribe();
            done();
          });

          store.insertDocument();
        });
      });

      context('when it is not a json mode', () => {
        const doc = new HadronDocument({ '$name': 'testing' });
        const jsonDoc = '';

        beforeEach(() => {
          store.state.insert.doc = doc;
          store.state.insert.jsonDoc = jsonDoc;
        });

        afterEach((done) => {
          dataService.deleteMany('compass-crud.test', {}, {}, done);
        });

        it('does not insert the document', (done) => {
          const unsubscribe = store.listen((state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.equal(doc);
            expect(state.insert.jsonDoc).to.equal(jsonDoc);
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
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true
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
          expect(state.insert.doc).to.deep.equal({});
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
    context('when there is no shard key', () => {
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
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true
        });
        dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when there is no error', () => {
        it('resets the documents to the first page', (done) => {
          const unsubscribe = store.listen((state) => {
            try {
              expect(state.error).to.equal(null);
              expect(state.docs).to.have.length(1);
              expect(state.count).to.equal(1);
              expect(state.start).to.equal(1);
              done();
            } catch (err) {
              done(err);
            } finally {
              unsubscribe();
            }
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
            try {
              expect(state.error).to.not.equal(null);
              expect(state.docs).to.have.length(0);
              expect(state.count).to.equal(0);
              expect(state.start).to.equal(0);
              done();
            } catch (err) {
              done(err);
            } finally {
              unsubscribe();
            }
          });

          store.refreshDocuments();
        });
      });
    });

    context('when there is a shard key', () => {
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
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true
        });
        dataService.insertOne('config.collections', { _id: 'compass-crud.test', key: { a: 1 } }, {}, done);
      });

      afterEach((done) => {
        dataService.deleteMany('config.collections', { _id: 'compass-crud.test' }, {}, done);
      });

      it('looks up the shard keys', (done) => {
        const unsubscribe = store.listen((state) => {
          expect(state.error).to.equal(null);
          expect(state.shardKeys).to.deep.equal({ a: 1 });
          unsubscribe();
          done();
        });

        store.refreshDocuments();
      });
    });

    context('with a projection', () => {
      let store;
      let actions;

      beforeEach((done) => {
        actions = configureActions();
        store = configureStore({
          query: { project: {_id: 0} },
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true
        });

        store.setState({query: {project: {_id: 0}}});
        dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('sets the state as not editable', (done) => {
        const unsubscribe = store.listen((state) => {
          try {
            expect(state.isEditable).to.equal(false);
            done();
          } catch (err) {
            done(err);
          } finally {
            unsubscribe();
          }
        });

        store.refreshDocuments();
      });
    });

    context('without a projection', () => {
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
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true
        });

        store.setState({isEditable: false});
        dataService.insertOne('compass-crud.test', { name: 'testing' }, {}, done);
      });

      afterEach((done) => {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('resets the state as editable', (done) => {
        const unsubscribe = store.listen((state) => {
          try {
            expect(state.isEditable).to.equal(true);
            done();
          } catch (err) {
            done(err);
          } finally {
            unsubscribe();
          }
        });

        store.refreshDocuments();
      });
    });
  });

  describe('default query for view with own sort orter', () => {
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
        namespace: 'compass-crud.testview',
        noRefreshOnConfigure: true
      });
      dataService.insertMany('compass-crud.test', [
        { _id: '001', cat: 'nori' },
        { _id: '002', cat: 'chashu' },
        { _id: '003', cat: 'amy' },
        { _id: '004', cat: 'pia' }
      ], {}, (err) => {
        if (err) return done(err);
        dataService.createView('testview', 'compass-crud.test', [{$sort: {cat: 1}}], {}, done);
      });
    });

    afterEach((done) => {
      dataService.deleteMany('compass-crud.test', {}, {}, (err) => {
        if (err) return done(err);
        dataService.dropView('compass-crud.testview', done);
      });
    });

    it('returns documents in view order', (done) => {
      const unsubscribe = store.listen((state) => {
        expect(state.docs).to.have.lengthOf(4);
        expect(state.docs.map(doc => doc.generateObject())).to.deep.equal([
          { _id: '003', cat: 'amy' },
          { _id: '002', cat: 'chashu' },
          { _id: '001', cat: 'nori' },
          { _id: '004', cat: 'pia' }
        ]);
        unsubscribe();
        done();
      });

      store.refreshDocuments();
    });
  });
});
