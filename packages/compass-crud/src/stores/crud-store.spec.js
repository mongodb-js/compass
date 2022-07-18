import util from 'util';
import Connection from 'mongodb-connection-model';
import { connect, convertConnectionModelToInfo } from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
import HadronDocument, { Element } from 'hadron-document';
import { once } from 'events';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

import configureStore, { findAndModifyWithFLEFallback } from './crud-store';
import configureActions from '../actions';

chai.use(chaiAsPromised);

const TEST_TIMESERIES = false; // TODO: base this off an env var once we have it

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud',
  mongodb_database_name: 'admin',
});

const delay = util.promisify(setTimeout);

function waitForStates(store, cbs, timeout = 2000) {
  let numMatches = 0;
  const states = [];
  const errors = [];
  let unsubscribe;

  const waiter = new Promise((resolve, reject) => {
    unsubscribe = store.listen((state) => {
      states.push(state);
      try {
        // eslint-disable-next-line callback-return
        cbs[numMatches](state, numMatches);
        ++numMatches;
        if (numMatches === cbs.length) {
          // Succeed once all the state transitions have been reached.
          resolve(true);
        }
      } catch (err) {
        if (err instanceof chai.AssertionError) {
          // If an assertion failed, assume this was an intermediate state
          // transition that we're not interested in. But do keep the error in
          // case we reach the timeout.
          errors.push(err);
        } else {
          // For all other errors, assume programmer error.
          reject(err);
        }
      }
    });
  });

  return Promise.race([waiter, delay(timeout)])
    .then((success) => {
      // If waiter resolved first then success will be true. delay doesn't
      // resolve to anything.
      if (success) {
        return success;
      }

      let message = 'Timeout reached before all state transitions';
      if (errors.length) {
        const lastError = errors[errors.length - 1];
        message += '\n\nLast Error:\n';
        message += `\n${lastError.stack}`;
      }
      const error = new Error(message);

      // keep these things to aid debugging
      error.states = states;
      error.errors = errors;
      error.numMatches = numMatches;

      throw error;
    })
    .finally(() => {
      unsubscribe();
    });
}

function waitForState(store, cb, timeout) {
  return waitForStates(store, [cb], timeout);
}

describe('store', function () {
  this.timeout(5000);

  let dataService;
  let createCollection;
  let dropCollection;

  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();

  before(async function () {
    const info = convertConnectionModelToInfo(CONNECTION);
    dataService = await connect(info.connectionOptions);

    createCollection = util.promisify(
      dataService.createCollection.bind(dataService)
    );
    dropCollection = util.promisify(
      dataService.dropCollection.bind(dataService)
    );

    // Add some validation so that we can test what happens when insert/update
    // fails below.

    try {
      await dropCollection('compass-crud.test');
    } catch (err) {
      // noop
    }

    await createCollection('compass-crud.test', {
      validator: {
        $jsonSchema: {
          bsonType: 'object',
          properties: {
            status: {
              enum: ['Unknown', 'Incomplete'],
              description: 'can only be one of the enum values',
            },
          },
        },
      },
    });
  });

  after(async function () {
    if (dataService) {
      await dataService.disconnect();
    }
  });

  beforeEach(function () {
    sinon.restore();
  });

  afterEach(function () {
    sinon.restore();
  });

  describe('#getInitialState', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        actions: actions,
      });
    });

    it('sets the initial state', function () {
      expect(store.state.resultId).to.be.a('number');
      delete store.state.resultId; // always different

      expect(store.state).to.deep.equal({
        abortController: null,
        sessions: null,
        debouncingLoad: false,
        loadingCount: false,
        collection: '',
        count: 0,
        docs: [],
        end: 0,
        error: null,
        insert: {
          doc: null,
          isCommentNeeded: true,
          isOpen: false,
          jsonDoc: null,
          jsonView: false,
          message: '',
          csfleState: { state: 'none' },
          mode: 'modifying',
        },
        isDataLake: false,
        isEditable: true,
        isReadonly: false,
        isTimeSeries: false,
        ns: '',
        outdated: false,
        page: 0,
        query: {
          collation: null,
          filter: {},
          limit: 0,
          maxTimeMS: 60000,
          project: null,
          skip: 0,
          sort: null,
        },
        shardKeys: null,
        start: 0,
        status: 'initial',
        table: {
          doc: null,
          editParams: null,
          path: [],
          types: [],
        },
        version: '3.4.0',
        view: 'List',
      });
    });
  });

  describe('#copyToClipboard', function () {
    let store;
    let actions;
    let mockCopyToClipboard;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        actions: actions,
      });

      mockCopyToClipboard = sinon.fake.resolves(null);

      try {
        sinon.replace(global, 'navigator', {
          clipboard: {
            writeText: mockCopyToClipboard,
          },
        });
      } catch (e) {
        // Electron has the global navigator as a getter.
        sinon.replaceGetter(global, 'navigator', () => ({
          clipboard: {
            writeText: mockCopyToClipboard,
          },
        }));
      }
    });

    it('copies the document to the clipboard', function () {
      expect(mockCopyToClipboard.called).to.equal(false);

      const doc = { _id: 'testing', name: 'heart 5' };
      const hadronDoc = new HadronDocument(doc);

      store.copyToClipboard(hadronDoc);
      expect(mockCopyToClipboard).to.have.been.calledOnceWithExactly(
        '{\n  "_id": "testing",\n  "name": "heart 5"\n}'
      );
    });
  });

  describe('#toggleInsertDocument', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        actions: actions,
      });
      store.openInsertDocumentDialog({ foo: 1 });
    });

    it('switches between JSON and Document view', async function () {
      let listener;

      listener = waitForState(store, (state) => {
        expect(state).to.have.nested.property('insert.jsonView', false);
      });

      store.toggleInsertDocument('List');

      await listener;

      listener = waitForState(store, (state) => {
        expect(state).to.have.nested.property('insert.jsonView', true);
      });

      store.toggleInsertDocument('JSON');

      await listener;
    });
  });

  describe('#onCollectionChanged', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        namespace: 'compass-crud.another',
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
      });
    });

    context('when the collection is not readonly', function () {
      beforeEach(function () {
        store.state.table.path = ['test-path'];
        store.state.table.types = ['test-types'];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      it('resets the state for the new editable collection', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(true);
          expect(state.ns).to.equal('compass-crud.another');
        });

        store.onCollectionChanged('compass-crud.another');

        await listener;
      });
    });

    context('when the collection is readonly', function () {
      beforeEach(function () {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          namespace: 'compass-crud.another',
          actions: actions,
          isReadonly: true,
        });
        store.state.table.path = ['test-path'];
        store.state.table.types = ['test-types'];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      it('resets the state for the new readonly collection', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(false);
          expect(state.ns).to.equal('compass-crud.another');
        });

        store.onCollectionChanged('compass-crud.another');

        await listener;
      });
    });

    context('when running in a readonly context', function () {
      beforeEach(function () {
        process.env.HADRON_READONLY = 'true';
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          namespace: 'compass-crud.another',
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
        });
        store.state.table.path = ['test-path'];
        store.state.table.types = ['test-types'];
        store.state.table.doc = {};
        store.state.table.editParams = {};
      });

      afterEach(function () {
        process.env.HADRON_READONLY = 'false';
      });

      it('resets the state for the new readonly collection', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.table.path).to.deep.equal([]);
          expect(state.table.types).to.deep.equal([]);
          expect(state.table.doc).to.equal(null);
          expect(state.table.editParams).to.equal(null);
          expect(state.collection).to.equal('another');
          expect(state.isEditable).to.equal(false);
          expect(state.ns).to.equal('compass-crud.another');
        });

        store.onCollectionChanged('compass-crud.another');

        await listener;
      });
    });
  });

  describe('#onQueryChanged', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    const query = {
      filter: { name: 'test' },
      sort: { name: 1 },
      collation: { locale: 'simple' },
      limit: 10,
      skip: 5,
    };

    it('resets the state', async function () {
      const listener = waitForState(store, (state) => {
        expect(state.error).to.equal(null);
        expect(state.docs).to.deep.equal([]);
        expect(state.count).to.equal(0);
      });

      store.onQueryChanged(query);

      await listener;
    });
  });

  describe('#removeDocument', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    context('when there is no error', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        store.state.count = 1;
        store.state.end = 1;
      });

      it('deletes the document from the collection', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.end).to.equal(0);
        });

        store.removeDocument(hadronDoc);

        await listener;
      });
    });

    context('when the _id is null', function () {
      const doc = { _id: null, name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        store.state.count = 1;
        store.state.end = 1;
      });

      it('deletes the document from the collection', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.end).to.equal(0);
        });

        store.removeDocument(hadronDoc);

        await listener;
      });
    });

    context('when the deletion errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'deleteOne')
          .yields({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('remove-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        store.removeDocument(hadronDoc);
      });
    });
  });

  describe('#updateDocument', function () {
    let store;
    let actions;

    beforeEach(function (done) {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
      dataService.insertOne(
        'compass-crud.test',
        {
          _id: 'testing',
          name: 'Depeche Mode',
        },
        {},
        done
      );
    });

    afterEach(function (done) {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    context('when there is no error', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        hadronDoc.elements.at(1).rename('new name');
      });

      it('replaces the document in the list', function (done) {
        const unsubscribe = store.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          expect(state.docs[0].elements.at(1).key === 'new name');
          unsubscribe();
          done();
        });

        hadronDoc.on('update-blocked', () => {
          done(new Error("Didn't expect update to be blocked."));
        });

        hadronDoc.on('update-error', (errorMessage) => {
          done(
            new Error(
              `Didn't expect update to error. Errored with message: ${errorMessage}`
            )
          );
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when a new field is added and there is no error', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        hadronDoc.insertAfter(
          hadronDoc.elements.at(1),
          'new field',
          'new field value'
        );
      });

      it('updates the document in the list', function (done) {
        const unsubscribe = store.listen((state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
          expect(state.docs[0]).to.have.property('elements');
          expect(state.docs[0].elements.at(2).key).to.equal('new field');
          unsubscribe();
          // Ensure we have enough time for update-blocked or update-error to be called.
          setTimeout(() => done(), 100);
        });

        hadronDoc.on('update-blocked', () => {
          done(new Error("Didn't expect update to be blocked."));
        });

        hadronDoc.on('update-error', (errorMessage) => {
          done(
            new Error(
              `Didn't expect update to error. Errored with message: ${errorMessage}`
            )
          );
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when there is no update to make', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'findOneAndUpdate')
          .yields({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal(
            'Unable to update, no changes have been made.'
          );
          done();
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when the update errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        hadronDoc.elements.at(1).rename('new name');
        sinon
          .stub(dataService, 'findOneAndUpdate')
          .yields({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when the update fails', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        hadronDoc.elements.at(1).rename('new name');
        sinon.stub(dataService, 'findOneAndUpdate').yields(null, null);
      });

      it('sets the update blocked for the document', function (done) {
        hadronDoc.on('update-blocked', () => {
          done();
        });

        store.updateDocument(hadronDoc);
      });
    });

    context('when update is called on an edited doc', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(function () {
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndUpdate').yields(null, {});
      });

      it('has the original value for the edited value in the query', async function () {
        await store.updateDocument(hadronDoc);

        expect(stub.getCall(0).args[1]).to.deep.equal({
          _id: 'testing',
          name: 'Beach Sand',
        });
        expect(stub.getCall(0).args[2]).to.deep.equal({
          $set: {
            name: 'Desert Sand',
          },
        });
      });
    });

    context(
      'when update is called on an edited doc in sharded collection',
      function () {
        const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
        const hadronDoc = new HadronDocument(doc);
        let stub;

        beforeEach(function () {
          store.state.shardKeys = { yes: 1 };
          hadronDoc.get('name').edit('Desert Sand');
          stub = sinon.stub(dataService, 'findOneAndUpdate').yields(null, {});
        });

        afterEach(function () {
          store.state.shardKeys = null;
        });

        it('has the shard key in the query', async function () {
          await store.updateDocument(hadronDoc);

          expect(stub.getCall(0).args[1]).to.deep.equal({
            _id: 'testing',
            name: 'Beach Sand',
            yes: 'no',
          });
          expect(stub.getCall(0).args[2]).to.deep.equal({
            $set: {
              name: 'Desert Sand',
            },
          });
        });
      }
    );

    context('when passed an invalid document', function () {
      it('should emit an error to the state', function (done) {
        const doc = { _id: 'testing', name: 'Beach Sand' };
        const invalidHadronDoc = new HadronDocument(doc);
        invalidHadronDoc.getId = null;

        invalidHadronDoc.on('update-error', (message) => {
          expect(message).to.equal(
            'An error occured when attempting to update the document: this.getId is not a function'
          );

          done();
        });

        store.updateDocument(invalidHadronDoc);
      });
    });

    context(
      'when csfle is enabled and the data-service says that updating would be unsafe',
      function () {
        const doc = { _id: 'testing', name: 'Beach Sand' };
        const hadronDoc = new HadronDocument(doc);
        let findOneAndReplaceStub;
        let findOneAndUpdateStub;
        let isUpdateAllowedStub;

        beforeEach(function () {
          hadronDoc.get('name').edit('Desert Sand');
          findOneAndReplaceStub = sinon
            .stub(dataService, 'findOneAndReplace')
            .yields(null, {});
          findOneAndUpdateStub = sinon
            .stub(dataService, 'findOneAndUpdate')
            .yields(null, {});
          isUpdateAllowedStub = sinon.stub().resolves(false);
          sinon.stub(dataService, 'getCSFLEMode').returns('enabled');
          sinon.stub(dataService, 'getCSFLECollectionTracker').returns({
            isUpdateAllowed: isUpdateAllowedStub,
          });
        });

        it('rejects the update and emits update-error', async function () {
          const updateErrorEvent = once(hadronDoc, 'update-error');

          await store.updateDocument(hadronDoc);
          expect((await updateErrorEvent)[0]).to.match(/Update blocked/);

          expect(findOneAndReplaceStub).to.not.have.been.called;
          expect(findOneAndUpdateStub).to.not.have.been.called;
          expect(isUpdateAllowedStub).to.have.been.calledWith(
            'compass-crud.test',
            doc
          );
        });
      }
    );
  });

  describe('#replaceDocument', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    context('when there is no error', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
      });

      it('replaces the document in the list', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs[0]).to.not.equal(hadronDoc);
        });

        store.replaceDocument(hadronDoc);

        await listener;
      });
    });

    context('when the replace errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'findOneAndReplace')
          .yields({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        store.replaceDocument(hadronDoc);
      });
    });

    context('when replace is called on an edited doc', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(function () {
        hadronDoc.get('name').edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndReplace').yields(null, {});
      });

      it('has the original value for the edited value in the query', async function () {
        await store.replaceDocument(hadronDoc);

        expect(stub.getCall(0).args[2]).to.deep.equal({
          _id: 'testing',
          name: 'Desert Sand',
        });
      });
    });

    context(
      'when update is called on an edited doc in sharded collection',
      function () {
        const doc = { _id: 'testing', name: 'Beach Sand', yes: 'no' };
        const hadronDoc = new HadronDocument(doc);
        let stub;

        beforeEach(function () {
          store.state.shardKeys = { yes: 1 };
          hadronDoc.get('name').edit('Desert Sand');
          stub = sinon.stub(dataService, 'findOneAndReplace').yields(null, {});
        });

        afterEach(function () {
          store.state.shardKeys = null;
        });

        it('has the shard key in the query', async function () {
          await store.replaceDocument(hadronDoc);

          expect(stub.getCall(0).args[1]).to.deep.equal({
            _id: 'testing',
            yes: 'no',
          });
          expect(stub.getCall(0).args[2]).to.deep.equal({
            _id: 'testing',
            name: 'Desert Sand',
            yes: 'no',
          });
        });
      }
    );

    context(
      'when csfle is enabled and the data-service says that updating would be unsafe',
      function () {
        const doc = { _id: 'testing', name: 'Beach Sand' };
        const hadronDoc = new HadronDocument(doc);
        let findOneAndReplaceStub;
        let findOneAndUpdateStub;
        let isUpdateAllowedStub;

        beforeEach(function () {
          hadronDoc.get('name').edit('Desert Sand');
          findOneAndReplaceStub = sinon
            .stub(dataService, 'findOneAndReplace')
            .yields(null, {});
          findOneAndUpdateStub = sinon
            .stub(dataService, 'findOneAndUpdate')
            .yields(null, {});
          isUpdateAllowedStub = sinon.stub().resolves(false);
          sinon.stub(dataService, 'getCSFLEMode').returns('enabled');
          sinon.stub(dataService, 'getCSFLECollectionTracker').returns({
            isUpdateAllowed: isUpdateAllowedStub,
          });
        });

        it('rejects the update and emits update-error', async function () {
          const updateErrorEvent = once(hadronDoc, 'update-error');

          await store.replaceDocument(hadronDoc);
          expect((await updateErrorEvent)[0]).to.match(/Update blocked/);

          expect(findOneAndReplaceStub).to.not.have.been.called;
          expect(findOneAndUpdateStub).to.not.have.been.called;
          expect(isUpdateAllowedStub).to.have.been.calledWith(
            'compass-crud.test',
            doc
          );
        });
      }
    );
  });

  describe('#insertOneDocument', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true,
      });
    });

    context('when there is no error', function () {
      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the document matches the filter', function () {
        const doc = new HadronDocument({ name: 'testing' });

        it('inserts the document', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(1);
            expect(state.count).to.equal(1);
            expect(state.end).to.equal(1);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
          });

          store.state.insert.doc = doc;
          store.insertDocument();

          await listener;
        });
      });

      context('when the document does not match the filter', function () {
        const doc = new HadronDocument({ name: 'testing' });

        beforeEach(function () {
          store.state.insert.doc = doc;
          store.state.query.filter = { name: 'something' };
        });

        it('inserts the document but does not add to the list', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
          });

          store.insertDocument();

          await listener;
        });
      });
    });

    context('when there is an error', function () {
      context('when it is a json mode', function () {
        const doc = {};
        // this should be invalid according to the validation rules
        const jsonDoc = '{ "status": "testing" }';

        beforeEach(function () {
          store.state.insert.jsonView = true;
          store.state.insert.doc = doc;
          store.state.insert.jsonDoc = jsonDoc;
        });

        afterEach(function (done) {
          dataService.deleteMany('compass-crud.test', {}, {}, done);
        });

        it('does not insert the document', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.deep.equal(doc);
            expect(state.insert.jsonDoc).to.equal(jsonDoc);
            expect(state.insert.isOpen).to.equal(true);
            expect(state.insert.jsonView).to.equal(true);
            expect(state.insert.message).to.not.equal('');
          });

          store.insertDocument();

          await listener;
        });
      });

      context('when it is not a json mode', function () {
        const doc = new HadronDocument({ status: 'testing' });
        const jsonDoc = '';

        beforeEach(function () {
          store.state.insert.doc = doc;
          store.state.insert.jsonDoc = jsonDoc;
        });

        afterEach(function (done) {
          dataService.deleteMany('compass-crud.test', {}, {}, done);
        });

        it('does not insert the document', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.equal(doc);
            expect(state.insert.jsonDoc).to.equal(jsonDoc);
            expect(state.insert.isOpen).to.equal(true);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.not.equal('');
          });

          store.state.insert.doc = doc;
          store.insertDocument();

          await listener;
        });
      });
    });
  });

  describe('#insertManyDocuments', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true,
      });
    });

    context('when there is no error', function () {
      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when the documents match the filter', function () {
        const docs =
          '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        it('inserts the document', async function () {
          const resultId = store.state.resultId;

          const listener = waitForStates(store, [
            (state) => {
              // after it inserted it will reset the insert state and start
              // refreshing the documents
              expect(state.insert.doc).to.equal(null);
              expect(state.insert.jsonDoc).to.equal(null);
              expect(state.insert.isOpen).to.equal(false);
              expect(state.insert.jsonView).to.equal(false);
              expect(state.insert.message).to.equal('');

              expect(state.status).to.equal('fetching');
              expect(state.abortController).to.not.be.null;
              expect(state.sessions).to.not.be.null;
              expect(state.outdated).to.be.false;
              expect(state.error).to.be.null;
            },
            (state) => {
              // after it refreshed the documents it will update the store again
              expect(state.error).to.equal(null);
              expect(state.docs.length).to.equal(2);
              expect(state.count).to.equal(2);
              expect(state.end).to.equal(2);

              // this is fetchedInitial because there's no filter/projection/collation
              expect(state.status).to.equal('fetchedInitial');
              expect(state.isEditable).to.equal(true);
              expect(state.error).to.be.null;
              expect(state.docs).to.have.lengthOf(2);
              expect(state.count).to.equal(2);
              expect(state.page).to.equal(0);
              expect(state.start).to.equal(1);
              expect(state.end).to.equal(2);
              expect(state.table).to.deep.equal({
                doc: null,
                editParams: null,
                path: [],
                types: [],
              });
              expect(state.shardKeys).to.deep.equal({});

              expect(state.abortController).to.be.null;
              expect(state.sessions).to.be.null;
              expect(state.resultId).to.not.equal(resultId);
            },
          ]);

          store.state.insert.jsonDoc = docs;
          store.insertMany();

          await listener;
        });
      });

      context('when none of the documents match the filter', function () {
        const docs =
          '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        beforeEach(function () {
          store.state.query.filter = { name: 'something' };
        });

        it('inserts both documents but does not add to the list', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.end).to.equal(0);
            expect(state.insert.doc).to.equal(null);
            expect(state.insert.jsonDoc).to.equal(null);
            expect(state.insert.isOpen).to.equal(false);
            expect(state.insert.jsonView).to.equal(false);
            expect(state.insert.message).to.equal('');
          });

          store.state.insert.jsonDoc = docs;
          store.insertMany();

          await listener;
        });
      });

      context('when only one of the documents match the filter', function () {
        const docs =
          '[ { "name": "Chashu", "type": "Norwegian Forest" }, { "name": "Rey", "type": "Viszla" } ]';

        beforeEach(function () {
          store.state.query.filter = { name: 'Rey' };
        });

        it('inserts both documents but only adds the matching one to the list', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.error).to.be.null;
            expect(state.docs).to.have.lengthOf(1);
            expect(state.count).to.equal(1);
            expect(state.page).to.equal(0);
            expect(state.start).to.equal(1);
            expect(state.end).to.equal(1);
          });

          store.state.insert.jsonDoc = docs;
          store.insertMany();

          await listener;
        });
      });
    });

    context('when there is an error', function () {
      const docs =
        '[ { "name": "Chashu", "type": "Norwegian Forest", "status": "invalid" }, { "name": "Rey", "type": "Viszla" } ]';

      beforeEach(function () {
        store.state.insert.jsonDoc = JSON.stringify(docs);
      });

      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('does not insert the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.insert.doc).to.deep.equal({});
          expect(state.insert.jsonDoc).to.deep.equal(docs);
          expect(state.insert.isOpen).to.equal(true);
          expect(state.insert.jsonView).to.equal(true);
          expect(state.insert.message).to.equal('Document failed validation');
        });

        store.state.insert.jsonDoc = docs;
        store.insertMany();

        await listener;
      });
    });
  });

  describe('#openInsertDocumentDialog', function () {
    const doc = { _id: 1, name: 'test' };
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    context('when clone is true', function () {
      it('removes _id from the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('name');
        });

        store.openInsertDocumentDialog(doc, true);

        await listener;
      });
    });

    context('when clone is false', function () {
      it('does not remove _id from the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('_id');
        });

        store.openInsertDocumentDialog(doc, false);

        await listener;
      });
    });

    context('with CSFLE connection', function () {
      let getCSFLEMode;
      let knownSchemaForCollection;
      let isUpdateAllowed;

      beforeEach(function () {
        knownSchemaForCollection = sinon.stub();
        isUpdateAllowed = sinon.stub();
        const csfleCollectionTracker = {
          knownSchemaForCollection,
          isUpdateAllowed,
        };
        getCSFLEMode = sinon.stub(dataService, 'getCSFLEMode');
        sinon
          .stub(dataService, 'getCSFLECollectionTracker')
          .returns(csfleCollectionTracker);
      });

      afterEach(function () {
        sinon.restore();
      });

      it('does not set csfle state if csfle is unavailable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({ state: 'none' });
        });

        getCSFLEMode.returns('unavailable');

        store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).not.have.been.called;
        expect(isUpdateAllowed).to.not.have.been.called;
      });

      it('sets csfle state appropiately if the collection has no known schema', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({
            state: 'no-known-schema',
          });
        });

        getCSFLEMode.returns('enabled');
        knownSchemaForCollection.resolves({ hasSchema: false, encryptedFields: { encryptedFields: [] } });

        store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).to.have.been.calledWith(
          'compass-crud.test'
        );
        expect(isUpdateAllowed).to.not.have.been.called;
      });

      it('sets csfle state appropiately if cloned document does not fully match schema', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({
            state: 'incomplete-schema-for-cloned-doc',
            encryptedFields: ['x'],
          });
        });

        getCSFLEMode.returns('enabled');
        knownSchemaForCollection.resolves({
          hasSchema: true,
          encryptedFields: { encryptedFields: [['x']] },
        });
        isUpdateAllowed.resolves(false);

        store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).to.have.been.calledWith(
          'compass-crud.test'
        );
        expect(isUpdateAllowed).to.have.been.calledOnce;
      });

      it('sets csfle state appropiately if collection has full schema', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({
            state: 'has-known-schema',
            encryptedFields: ['x'],
          });
        });

        getCSFLEMode.returns('enabled');
        knownSchemaForCollection.resolves({
          hasSchema: true,
          encryptedFields: { encryptedFields: [['x']] },
        });
        isUpdateAllowed.resolves(true);

        store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).to.have.been.calledWith(
          'compass-crud.test'
        );
        expect(isUpdateAllowed).to.have.been.calledOnce;
      });

      it('sets csfle state appropiately if csfle is temporarily disabled', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({
            state: 'csfle-disabled',
          });
        });

        getCSFLEMode.returns('disabled');
        knownSchemaForCollection.resolves({
          hasSchema: true,
          encryptedFields: { encryptedFields: [['x']] },
        });
        isUpdateAllowed.resolves(true);

        store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).to.not.have.been.called;
        expect(isUpdateAllowed).to.not.have.been.called;
      });
    });
  });

  describe('#drillDown', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    const doc = { field4: 'value' };
    const element = new Element('field3', 'value');
    const editParams = { colId: 1, rowIndex: 0 };

    it('sets the drill down state', async function () {
      const listener = waitForState(store, (state) => {
        expect(state.table.doc).to.deep.equal(doc);
        expect(state.table.path).to.deep.equal(['field3']);
        expect(state.table.types).to.deep.equal(['String']);
        expect(state.table.editParams).to.deep.equal(editParams);
      });

      store.drillDown(doc, element, editParams);

      await listener;
    });
  });

  describe('#pathChanged', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    const path = ['field1', 'field2'];
    const types = ['Object', 'Array'];

    it('sets the path and types state', async function () {
      const listener = waitForState(store, (state) => {
        expect(state.table.path).to.deep.equal(path);
        expect(state.table.types).to.deep.equal(types);
      });

      store.pathChanged(path, types);

      await listener;
    });
  });

  describe('#viewChanged', function () {
    let store;
    let actions;

    beforeEach(function () {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
      });
    });

    it('sets the view', async function () {
      const listener = waitForState(store, (state) => {
        expect(state.view).to.equal('Table');
      });

      store.viewChanged('Table');

      await listener;
    });
  });

  describe('#refreshDocuments', function () {
    context('when there is no shard key', function () {
      let store;
      let actions;

      beforeEach(function (done) {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        });
        dataService.insertOne(
          'compass-crud.test',
          { name: 'testing' },
          {},
          done
        );
      });

      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      context('when there is no error', function () {
        it('resets the documents to the first page', async function () {
          const listener = waitForStates(store, [
            (state) => {
              expect(state.debouncingLoad).to.equal(true);
              expect(state.count).to.equal(null);
            },

            (state) => {
              expect(state.error).to.equal(null);
              expect(state.docs).to.have.length(1);
              expect(state.debouncingLoad).to.equal(false);
              expect(state.count).to.equal(1);
              expect(state.start).to.equal(1);
              expect(state.shardKeys).to.deep.equal({});
            },
          ]);

          store.refreshDocuments();

          await listener;
        });
      });

      context('when there is an error', function () {
        beforeEach(function () {
          store.state.query.filter = { $iamnotanoperator: 1 };
        });

        afterEach(function () {
          store.state.query.filter = {};
        });

        it('resets the documents to the first page', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.error).to.not.equal(null);
            expect(state.docs).to.have.length(0);
            expect(state.count).to.equal(null);
            expect(state.start).to.equal(0);
          });

          store.refreshDocuments();

          await listener;
        });
      });
    });

    context('when there is a shard key', function () {
      let store;
      let actions;

      beforeEach(function (done) {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        });
        dataService.insertOne(
          'config.collections',
          { _id: 'compass-crud.test', key: { a: 1 } },
          {},
          done
        );
      });

      afterEach(function (done) {
        dataService.deleteMany(
          'config.collections',
          { _id: 'compass-crud.test' },
          {},
          done
        );
      });

      it('looks up the shard keys', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.error).to.equal(null);
          expect(state.shardKeys).to.deep.equal({ a: 1 });
        });

        store.refreshDocuments();

        await listener;
      });
    });

    context('with a projection', function () {
      let store;
      let actions;

      beforeEach(function (done) {
        actions = configureActions();
        store = configureStore({
          query: { project: { _id: 0 } },
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        });

        store.setState({ query: { project: { _id: 0 } } });
        dataService.insertOne(
          'compass-crud.test',
          { name: 'testing' },
          {},
          done
        );
      });

      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('sets the state as not editable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.isEditable).to.equal(false);
        });

        store.refreshDocuments();

        await listener;
      });
    });

    context('without a projection', function () {
      let store;
      let actions;

      beforeEach(function (done) {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        });

        store.setState({ isEditable: false });
        dataService.insertOne(
          'compass-crud.test',
          { name: 'testing' },
          {},
          done
        );
      });

      afterEach(function (done) {
        dataService.deleteMany('compass-crud.test', {}, {}, done);
      });

      it('resets the state as editable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.isEditable).to.equal(true);
        });

        store.refreshDocuments();

        await listener;
      });
    });

    context('when the collection is a timeseries', function () {
      if (!TEST_TIMESERIES) {
        return;
      }

      let store;
      let actions;

      beforeEach(async function () {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.timeseries',
          noRefreshOnConfigure: true,
        });

        store.setState({ isTimeSeries: true });

        try {
          await dropCollection('compass-crud.timeseries');
        } catch (err) {
          // noop
        }

        await createCollection('compass-crud.timeseries', {
          timeseries: { timeField: 'timestamp ' },
        });
      });

      it('does not specify the _id_ index as hint', async function () {
        const spy = sinon.spy(dataService, 'aggregate');
        const listener = waitForState(store, (state) => {
          expect(state.count).to.equal(0);
        });

        store.refreshDocuments();

        await listener;

        // the count should be the only aggregate we ran
        expect(spy.callCount).to.equal(1);
        const opts = spy.args[0][2];
        expect(opts.hint).to.not.exist;
      });
    });

    context('when cancelling the operation', function () {
      let store;
      let actions;

      beforeEach(function () {
        actions = configureActions();
        store = configureStore({
          localAppRegistry: localAppRegistry,
          globalAppRegistry: globalAppRegistry,
          dataProvider: {
            error: null,
            dataProvider: dataService,
          },
          actions: actions,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        });
      });

      it('aborts the queries and kills the sessions', async function () {
        const spy = sinon.spy(dataService, 'aggregate');

        const listener = waitForStates(store, [
          (state) => {
            // cancel the operation as soon as the query starts
            expect(state.status).to.equal('fetching');
            expect(state.count).to.be.null;
            expect(state.loadingCount).to.be.true; // initially count is still loading
            expect(state.error).to.be.null;
            expect(state.abortController).to.not.be.null;
            expect(state.sessions).to.not.be.null;

            store.cancelOperation();
          },

          (state) => {
            // cancelOperation cleans up abortController
            expect(state.abortController).to.be.null;
          },

          (state) => {
            // onAbort cleans up state.session
            expect(state.sessions).to.be.null;
          },

          (state) => {
            // the operation should fail
            expect(state.status).to.equal('error');
            expect(state.error.message).to.equal(
              'The operation was cancelled.'
            );
            expect(state.abortController).to.be.null;
            expect(state.sessions).to.be.null;
            expect(state.loadingCount).to.be.false; // eventually count loads
          },
        ]);

        store.refreshDocuments();

        await listener;

        // the count should be the only aggregate we ran
        expect(spy.callCount).to.equal(1);
        const opts = spy.args[0][2];
        expect(opts.hint).to.equal('_id_');
      });
    });
  });

  describe('#getPage', function () {
    let store;
    let actions;
    let fetchSpy;

    beforeEach(function (done) {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.test',
        noRefreshOnConfigure: true,
      });

      fetchSpy = sinon.spy(store.dataService, 'fetch');

      const docs = [...Array(1000).keys()].map((i) => ({ i }));
      dataService.insertMany('compass-crud.test', docs, {}, done);
    });

    afterEach(function (done) {
      dataService.deleteMany('compass-crud.test', {}, {}, done);
    });

    it('does nothing for negative page numbers', async function () {
      await store.getPage(-1);
      expect(fetchSpy.called).to.be.false;
    });

    it('does nothing if documents are already being fetched', async function () {
      store.state.status = 'fetching';
      await store.getPage(1);
      expect(fetchSpy.called).to.be.false;
    });

    it('does nothing if the page being requested is past the end', async function () {
      store.state.query.limit = 20;
      await store.getPage(1); // there is only one page of 20
      expect(fetchSpy.called).to.be.false;
    });

    it('does not ask for documents past the end', async function () {
      store.state.query.limit = 21;
      await store.getPage(1); // there is only one page of 20
      expect(fetchSpy.called).to.be.true;
      const opts = fetchSpy.args[0][2];
      // the second page should only have 1 due to the limit
      expect(opts.limit).to.equal(1);
    });

    it('sets status fetchedPagination if it succeeds with no filter', async function () {
      await store.getPage(1); // there is only one page of 20
      expect(fetchSpy.called).to.be.true;
      expect(store.state.status).to.equal('fetchedPagination');
    });

    it('sets status fetchedPagination if it succeeds with a filter', async function () {
      store.state.query.filter = { i: { $gt: 1 } };
      await store.getPage(1); // there is only one page of 20
      expect(fetchSpy.called).to.be.true;
      expect(store.state.status).to.equal('fetchedPagination');
    });

    it('sets status error if it fails', async function () {
      // remove the spy and replace it with a stub
      fetchSpy.restore();
      const fetchStub = sinon.stub(store.dataService, 'fetch').returns({
        toArray: () => {
          throw new Error('This is a fake error.');
        },
      });

      expect(store.state.abortController).to.be.null;
      expect(store.state.sessions).to.be.null;

      const promise = store.getPage(1);
      expect(store.state.abortController).to.not.be.null;
      expect(store.state.sessions).to.not.be.null;

      await promise;
      expect(store.state.error.message).to.equal('This is a fake error.');

      expect(fetchStub.called).to.be.true;
    });

    it('allows the operation to be cancelled', async function () {
      expect(store.state.abortController).to.be.null;
      expect(store.state.sessions).to.be.null;

      const promise = store.getPage(1);
      expect(store.state.abortController).to.not.be.null;
      expect(store.state.sessions).to.not.be.null;

      store.cancelOperation();
      expect(store.state.abortController).to.be.null;
      expect(store.state.sessions).to.be.null;
      expect(store.state.error).to.be.null;

      await promise;
      expect(store.state.error.message).to.equal(
        'The operation was cancelled.'
      );

      expect(fetchSpy.called).to.be.true;
    });
  });

  describe.skip('default query for view with own sort order', function () {
    let store;
    let actions;

    beforeEach(function (done) {
      actions = configureActions();
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        actions: actions,
        namespace: 'compass-crud.testview',
        noRefreshOnConfigure: true,
      });
      dataService.insertMany(
        'compass-crud.test',
        [
          { _id: '001', cat: 'nori' },
          { _id: '002', cat: 'chashu' },
          { _id: '003', cat: 'amy' },
          { _id: '004', cat: 'pia' },
        ],
        {},
        (err) => {
          if (err) return done(err);
          dataService.createView(
            'testview',
            'compass-crud.test',
            [{ $sort: { cat: 1 } }],
            {},
            (createViewError) => {
              if (createViewError) return done(createViewError);
              done();
            }
          );
        }
      );
    });

    afterEach(function (done) {
      dataService.deleteMany('compass-crud.test', {}, {}, (err) => {
        if (err) return done(err);
        dataService.dropView('compass-crud.testview', done);
      });
    });

    it('returns documents in view order', async function () {
      const listener = waitForState(store, (state) => {
        expect(state.docs).to.have.lengthOf(4);
        expect(state.docs.map((doc) => doc.generateObject())).to.deep.equal([
          { _id: '003', cat: 'amy' },
          { _id: '002', cat: 'chashu' },
          { _id: '001', cat: 'nori' },
          { _id: '004', cat: 'pia' },
        ]);
      });

      store.refreshDocuments();

      await listener;
    });
  });

  describe('#findAndModifyWithFLEFallback', function () {
    let dataServiceStub;

    beforeEach(function () {
      dataServiceStub = {
        find: sinon
          .stub()
          .callsFake((ns, query, opts, cb) => cb(undefined, [query])),
      };
    });

    it('does the original findAndModify operation and nothing more if it succeeds', async function () {
      const document = { _id: 1234 };
      const stub = sinon.stub().callsFake((ds, ns, opts, cb) => {
        cb(undefined, document);
      });
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        stub
      );
      expect(error).to.equal(undefined);
      expect(d).to.equal(document);
      expect(stub).to.have.callCount(1);
      expect(stub.firstCall.args[0]).to.equal(dataServiceStub);
      expect(stub.firstCall.args[1]).to.equal('db.coll');
      expect(stub.firstCall.args[2]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
    });

    it('does the original findAndModify operation and nothing more if it fails with a non-FLE error', async function () {
      const err = new Error('failed');
      const stub = sinon.stub().callsFake((ds, ns, opts, cb) => {
        cb(err);
      });
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        stub
      );
      expect(error).to.equal(err);
      expect(d).to.equal(undefined);
      expect(stub).to.have.callCount(1);
      expect(stub.firstCall.args[0]).to.equal(dataServiceStub);
      expect(stub.firstCall.args[1]).to.equal('db.coll');
      expect(stub.firstCall.args[2]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
    });

    it('retries findAndModify with FLE returnDocument: "after"', async function () {
      const document = { _id: 1234 };
      const err = Object.assign(new Error('failed'), { code: 6371402 });
      const stub = sinon.stub();
      stub.onFirstCall().callsFake((ds, ns, opts, cb) => {
        cb(err);
      });
      stub.onSecondCall().callsFake((ds, ns, opts, cb) => {
        cb(undefined, document);
      });
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        stub
      );
      expect(error).to.equal(undefined);
      expect(d).to.deep.equal(document);
      expect(stub).to.have.callCount(2);
      expect(stub.firstCall.args[0]).to.equal(dataServiceStub);
      expect(stub.firstCall.args[1]).to.equal('db.coll');
      expect(stub.firstCall.args[2]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
      expect(stub.secondCall.args[0]).to.equal(dataServiceStub);
      expect(stub.secondCall.args[1]).to.equal('db.coll');
      expect(stub.secondCall.args[2]).to.deep.equal({
        returnDocument: 'before',
        promoteValues: false,
      });
      expect(dataServiceStub.find).to.have.callCount(1);
      expect(dataServiceStub.find.firstCall.args[0]).to.equal('db.coll');
      expect(dataServiceStub.find.firstCall.args[1]).to.deep.equal(document);
      expect(dataServiceStub.find.firstCall.args[2]).to.deep.equal({
        returnDocument: 'before',
        promoteValues: false,
      });
    });

    it('returns the original error if the fallback find operation fails', async function () {
      dataServiceStub.find.yields(new Error('find failed'));
      const document = { _id: 1234 };
      const err = Object.assign(new Error('failed'), { code: 6371402 });
      const stub = sinon.stub();
      stub.onFirstCall().callsFake((ds, ns, opts, cb) => {
        cb(err);
      });
      stub.onSecondCall().callsFake((ds, ns, opts, cb) => {
        cb(undefined, document);
      });
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        stub
      );
      expect(error).to.equal(err);
      expect(d).to.equal(undefined);
      expect(stub).to.have.callCount(2);
      expect(dataServiceStub.find).to.have.callCount(1);
    });
  });
});
