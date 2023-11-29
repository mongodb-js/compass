import util from 'util';
import type { DataService } from 'mongodb-data-service';
import { connect } from 'mongodb-data-service';
import AppRegistry from 'hadron-app-registry';
import HadronDocument, { Element } from 'hadron-document';
import { MongoDBInstance } from 'mongodb-instance-model';
import { once } from 'events';
import sinon from 'sinon';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import type { CrudStore } from './crud-store';
import {
  findAndModifyWithFLEFallback,
  fetchDocuments,
  activateDocumentsPlugin,
} from './crud-store';
import { Int32 } from 'bson';
import { mochaTestServer } from '@mongodb-js/compass-test-server';
import {
  FavoriteQueryStorage,
  RecentQueryStorage,
} from '@mongodb-js/my-queries-storage';
import { satisfies } from 'semver';

chai.use(chaiAsPromised);

const delay = util.promisify(setTimeout);

function waitForStates(store, cbs, timeout = 2000) {
  let numMatches = 0;
  const states: any[] = [];
  const errors: Error[] = [];
  let unsubscribe: () => void;

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
      const error: any = new Error(message);

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

function waitForState(store, cb, timeout?: number) {
  return waitForStates(store, [cb], timeout);
}

describe('store', function () {
  this.timeout(5000);

  const cluster = mochaTestServer({
    topology: 'replset',
    secondaries: 0,
  });
  let dataService: DataService;
  let deactivate: (() => void) | null = null;
  let instance: MongoDBInstance;

  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();

  before(async function () {
    dataService = await connect({
      connectionOptions: {
        connectionString: cluster().connectionString,
      },
    });

    // Add some validation so that we can test what happens when insert/update
    // fails below.

    try {
      await dataService.dropCollection('compass-crud.test');
    } catch (err) {
      // noop
    }

    await dataService.createCollection('compass-crud.test', {
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
    await dataService?.disconnect();
  });

  beforeEach(function () {
    const topologyDescription = {
      type: 'Unknown',
      servers: [{ type: 'Unknown' }],
    };

    instance = new MongoDBInstance({
      _id: '123',
      topologyDescription,
      build: {
        version: '6.0.0',
      },
      dataLake: {
        isDataLake: false,
      },
    } as any);

    sinon.restore();
  });

  afterEach(function () {
    deactivate?.();
    deactivate = null;
    sinon.restore();
  });

  describe('#getInitialState', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'db.col',
          noRefreshOnConfigure: true, // so it won't start loading before we can check the initial state
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    it('sets the initial state', function () {
      expect(store.state.resultId).to.be.a('number');
      delete store.state.resultId; // always different

      expect(store.state).to.deep.equal({
        abortController: null,
        bulkDelete: {
          affected: 0,
          previews: [],
          status: 'closed',
        },
        debouncingLoad: false,
        loadingCount: false,
        collection: 'col',
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
        bulkUpdate: {
          isOpen: false,
          preview: {
            changes: [],
          },
          serverError: undefined,
          syntaxError: undefined,
          updateText: '{\n  $set: {}\n}',
        },
        instanceDescription: 'Topology type: Unknown is not writable',
        isDataLake: false,
        isEditable: true,
        isReadonly: false,
        isSearchIndexesSupported: true,
        isTimeSeries: false,
        isUpdatePreviewSupported: true,
        isWritable: false,
        ns: 'db.col',
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
        isCollectionScan: false,
        version: '6.0.0',
        view: 'List',
        fields: [],
      });
    });
  });

  describe('#copyToClipboard', function () {
    let store: CrudStore;
    let mockCopyToClipboard: any;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'db.col',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();

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
    let store: CrudStore;

    beforeEach(async function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'db.col',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();

      await store.openInsertDocumentDialog({ foo: 1 });
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
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.another',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: true,
            isTimeSeries: false,
            namespace: 'compass-crud.another',
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
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
  });

  describe('#onQueryChanged', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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

        void store.removeDocument(hadronDoc);

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

        void store.removeDocument(hadronDoc);

        await listener;
      });
    });

    context('when the count is null', function () {
      const doc = { _id: null, name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        store.state.count = null;
        store.state.end = 1;
      });

      it('keeps the count as null after the delete', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(null);
          expect(state.end).to.equal(0);
        });

        void store.removeDocument(hadronDoc);

        await listener;
      });
    });

    context('when the deletion errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'deleteOne')
          .rejects({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('remove-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        void store.removeDocument(hadronDoc);
      });
    });
  });

  describe('#updateDocument', function () {
    let store: CrudStore;

    beforeEach(async function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
      await dataService.insertOne('compass-crud.test', {
        _id: 'testing',
        name: 'Depeche Mode',
      });
    });

    afterEach(function () {
      return dataService.deleteMany('compass-crud.test', {});
    });

    context('when there is no error', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        store.state.docs = [hadronDoc];
        hadronDoc.elements.at(1)?.rename('new name');
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

        void store.updateDocument(hadronDoc);
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

        void store.updateDocument(hadronDoc);
      });
    });

    context('when there is no update to make', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'findOneAndUpdate')
          .throws({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal(
            'Unable to update, no changes have been made.'
          );
          done();
        });

        void store.updateDocument(hadronDoc);
      });
    });

    context('when the update errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        hadronDoc.elements.at(1)?.rename('new name');
        sinon
          .stub(dataService, 'findOneAndUpdate')
          .throws({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        void store.updateDocument(hadronDoc);
      });
    });

    context('when the update fails', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        hadronDoc.elements.at(1)?.rename('new name');
        sinon.stub(dataService, 'findOneAndUpdate').resolves(null);
      });

      it('sets the update blocked for the document', function (done) {
        hadronDoc.on('update-blocked', () => {
          done();
        });

        void store.updateDocument(hadronDoc);
      });
    });

    context('when update is called on an edited doc', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(function () {
        hadronDoc.get('name')?.edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndUpdate').resolves({});
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
          hadronDoc.get('name')?.edit('Desert Sand');
          stub = sinon.stub(dataService, 'findOneAndUpdate').resolves({});
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

        void store.updateDocument(invalidHadronDoc);
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
          hadronDoc.get('name')?.edit('Desert Sand');
          findOneAndReplaceStub = sinon
            .stub(dataService, 'findOneAndReplace')
            .resolves({});
          findOneAndUpdateStub = sinon
            .stub(dataService, 'findOneAndUpdate')
            .resolves({});
          isUpdateAllowedStub = sinon.stub().resolves(false);
          sinon.stub(dataService, 'getCSFLEMode').returns('enabled');
          sinon
            .stub(dataService, 'isUpdateAllowed')
            .callsFake(isUpdateAllowedStub);
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

  describe('#bulkUpdateDialog', function () {
    let store: CrudStore;

    beforeEach(async function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
      await dataService.insertOne('compass-crud.test', { name: 'testing' });
    });

    afterEach(function () {
      return dataService.deleteMany('compass-crud.test', {});
    });

    it('opens the bulk update dialog with a proper initialised state', async function () {
      void store.openBulkUpdateDialog();

      await waitForState(store, (state) => {
        expect(state.bulkUpdate.previewAbortController).to.not.exist;
      });

      const bulkUpdate = store.state.bulkUpdate;

      delete bulkUpdate.preview.changes[0].before._id;
      delete bulkUpdate.preview.changes[0].after._id;

      expect(bulkUpdate).to.deep.equal({
        isOpen: true,
        preview: {
          changes: [
            {
              before: {
                name: 'testing',
              },
              after: {
                name: 'testing',
              },
            },
          ],
        },
        previewAbortController: undefined,
        serverError: undefined,
        syntaxError: undefined,
        updateText: '{ $set: { } }',
      });
    });

    it('closes the bulk dialog keeping previous state', async function () {
      void store.openBulkUpdateDialog();
      void store.openBulkUpdateDialog();

      await waitForState(store, (state) => {
        expect(state.bulkUpdate.previewAbortController).to.not.exist;
      });

      store.closeBulkUpdateDialog();

      const bulkUpdate = store.state.bulkUpdate;

      delete bulkUpdate.preview.changes[0].before._id;
      delete bulkUpdate.preview.changes[0].after._id;

      expect(bulkUpdate).to.deep.equal({
        isOpen: false,
        preview: {
          changes: [
            {
              before: {
                name: 'testing',
              },
              after: {
                name: 'testing',
              },
            },
          ],
        },
        previewAbortController: undefined,
        serverError: undefined,
        syntaxError: undefined,
        updateText: '{ $set: { } }',
      });
    });
  });

  describe('#bulkDeleteDialog', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    it('opens the bulk dialog with a proper initialised state', function () {
      const hadronDoc = new HadronDocument({ a: 1 });
      store.state.docs = [hadronDoc];
      store.state.count = 1;

      store.openBulkDeleteDialog();

      expect(store.state.bulkDelete).to.deep.equal({
        previews: [hadronDoc],
        status: 'open',
        affected: 1,
      });
    });

    it('closes the bulk dialog keeping previous state', function () {
      const hadronDoc = new HadronDocument({ a: 1 });
      store.state.docs = [hadronDoc];
      store.state.count = 1;

      store.openBulkDeleteDialog();
      store.closeBulkDeleteDialog();

      expect(store.state.bulkDelete).to.deep.equal({
        previews: [hadronDoc],
        status: 'closed',
        affected: 1,
      });
    });

    it('triggers code export', function (done) {
      store.state.query.filter = { query: 1 };
      store.localAppRegistry.on(
        'open-query-export-to-language',
        (options, exportMode) => {
          expect(exportMode).to.equal('Delete Query');
          expect(options).to.deep.equal({ filter: '{\n query: 1\n}' });

          done();
        }
      );

      store.openDeleteQueryExportToLanguageDialog();
    });
  });

  describe('#replaceDocument', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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

        void store.replaceDocument(hadronDoc);

        await listener;
      });
    });

    context('when the replace errors', function () {
      const doc = { _id: 'testing', name: 'Depeche Mode' };
      const hadronDoc = new HadronDocument(doc);

      beforeEach(function () {
        sinon
          .stub(dataService, 'findOneAndReplace')
          .rejects({ message: 'error happened' });
      });

      it('sets the error for the document', function (done) {
        hadronDoc.on('update-error', (message) => {
          expect(message).to.equal('error happened');
          done();
        });

        void store.replaceDocument(hadronDoc);
      });
    });

    context('when replace is called on an edited doc', function () {
      const doc = { _id: 'testing', name: 'Beach Sand' };
      const hadronDoc = new HadronDocument(doc);
      let stub;

      beforeEach(function () {
        hadronDoc.get('name')?.edit('Desert Sand');
        stub = sinon.stub(dataService, 'findOneAndReplace').resolves({});
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
          hadronDoc.get('name')?.edit('Desert Sand');
          stub = sinon.stub(dataService, 'findOneAndReplace').resolves({});
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
          hadronDoc.get('name')?.edit('Desert Sand');
          findOneAndReplaceStub = sinon
            .stub(dataService, 'findOneAndReplace')
            .resolves({});
          findOneAndUpdateStub = sinon
            .stub(dataService, 'findOneAndUpdate')
            .resolves({});
          isUpdateAllowedStub = sinon.stub().resolves(false);
          sinon.stub(dataService, 'getCSFLEMode').returns('enabled');
          sinon
            .stub(dataService, 'isUpdateAllowed')
            .callsFake(isUpdateAllowedStub);
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
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    context('when there is no error', function () {
      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
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
          void store.insertDocument();

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

          void store.insertDocument();

          await listener;
        });
      });

      context('when the document has invalid bson', function () {
        // this is invalid ObjectId
        const jsonDoc = '{"_id": {"$oid": ""}}';

        beforeEach(function () {
          store.state.insert.jsonView = true;
          store.state.insert.doc = {};
          store.state.insert.jsonDoc = jsonDoc;
        });

        it('does not insert the document and sets the error', async function () {
          const listener = waitForState(store, (state) => {
            expect(state.docs.length).to.equal(0);
            expect(state.count).to.equal(0);
            expect(state.insert.doc).to.deep.equal({});
            expect(state.insert.jsonDoc).to.equal(jsonDoc);
            expect(state.insert.isOpen).to.equal(true);
            expect(state.insert.jsonView).to.equal(true);
            expect(state.insert.message).to.not.equal('');
            expect(state.insert.mode).to.equal('error');
          });

          void store.insertDocument();

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

        afterEach(function () {
          return dataService.deleteMany('compass-crud.test', {});
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

          void store.insertDocument();

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

        afterEach(function () {
          return dataService.deleteMany('compass-crud.test', {});
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
          void store.insertDocument();

          await listener;
        });
      });
    });
  });

  describe('#insertManyDocuments', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    context('when there is no error', function () {
      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
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
              expect(state.resultId).to.not.equal(resultId);
            },
          ]);

          store.state.insert.jsonDoc = docs;
          void store.insertMany();

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
          void store.insertMany();

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
          void store.insertMany();

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

      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
      });

      it('does not insert the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.docs.length).to.equal(0);
          expect(state.count).to.equal(0);
          expect(state.insert.doc?.generateObject()).to.deep.equal({});
          expect(state.insert.jsonDoc).to.deep.equal(docs);
          expect(state.insert.isOpen).to.equal(true);
          expect(state.insert.jsonView).to.equal(true);
          expect(state.insert.message).to.equal('Document failed validation');
        });

        store.state.insert.jsonDoc = docs;
        void store.insertMany();

        await listener;
      });
    });
  });

  describe('#openInsertDocumentDialog', function () {
    const doc = { _id: 1, name: 'test' };
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    context('when clone is true', function () {
      it('removes _id from the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('name');
        });

        void store.openInsertDocumentDialog(doc, true);

        await listener;
      });
    });

    context('when clone is false', function () {
      it('does not remove _id from the document', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.doc.elements.at(0).key).to.equal('_id');
        });

        void store.openInsertDocumentDialog(doc, false);

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
        getCSFLEMode = sinon.stub(dataService, 'getCSFLEMode');
        sinon
          .stub(dataService, 'knownSchemaForCollection')
          .callsFake(knownSchemaForCollection);
        sinon.stub(dataService, 'isUpdateAllowed').callsFake(isUpdateAllowed);
      });

      afterEach(function () {
        sinon.restore();
      });

      it('does not set csfle state if csfle is unavailable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.insert.csfleState).to.deep.equal({ state: 'none' });
        });

        getCSFLEMode.returns('unavailable');

        void store.openInsertDocumentDialog(doc, false);

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
        knownSchemaForCollection.resolves({
          hasSchema: false,
          encryptedFields: { encryptedFields: [] },
        });

        void store.openInsertDocumentDialog(doc, false);

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

        void store.openInsertDocumentDialog(doc, false);

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

        void store.openInsertDocumentDialog(doc, false);

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

        void store.openInsertDocumentDialog(doc, false);

        await listener;

        expect(getCSFLEMode).to.have.been.calledOnce;
        expect(knownSchemaForCollection).to.not.have.been.called;
        expect(isUpdateAllowed).to.not.have.been.called;
      });
    });
  });

  describe('#drillDown', function () {
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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
    let store: CrudStore;

    beforeEach(function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
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
      let store: CrudStore;

      beforeEach(async function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.test',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
        await dataService.insertOne('compass-crud.test', { name: 'testing' });
      });

      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
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

          void store.refreshDocuments();

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

          void store.refreshDocuments();

          await listener;
        });
      });
    });

    context('when there is a shard key', function () {
      let store: CrudStore;
      beforeEach(async function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.test',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
        await dataService.insertOne('config.collections', {
          _id: 'compass-crud.test',
          key: { a: 1 },
        });
      });

      afterEach(function () {
        return dataService.deleteMany('config.collections', {
          _id: 'compass-crud.test',
        });
      });

      it('looks up the shard keys', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.error).to.equal(null);
          expect(state.shardKeys).to.deep.equal({ a: 1 });
        });

        void store.refreshDocuments();

        await listener;
      });
    });

    context('with a projection', function () {
      let store: CrudStore;
      beforeEach(async function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.test',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();

        store.setState({ query: { project: { _id: 0 } } });
        await dataService.insertOne('compass-crud.test', { name: 'testing' });
      });

      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
      });

      it('sets the state as not editable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.isEditable).to.equal(false);
        });

        void store.refreshDocuments();

        await listener;
      });
    });

    context('without a projection', function () {
      let store: CrudStore;

      beforeEach(async function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.test',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
        store.setState({ isEditable: false });
        await dataService.insertOne('compass-crud.test', { name: 'testing' });
      });

      afterEach(function () {
        return dataService.deleteMany('compass-crud.test', {});
      });

      it('resets the state as editable', async function () {
        const listener = waitForState(store, (state) => {
          expect(state.isEditable).to.equal(true);
        });

        void store.refreshDocuments();

        await listener;
      });
    });

    context('when the collection is a timeseries', function () {
      let store: CrudStore;

      beforeEach(async function () {
        if (!satisfies(cluster().serverVersion, '>= 5.0.0')) {
          return this.skip();
        }
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: true,
            namespace: 'compass-crud.timeseries',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();

        try {
          await dataService.dropCollection('compass-crud.timeseries');
        } catch (err) {
          // noop
        }

        await dataService.createCollection('compass-crud.timeseries', {
          timeseries: { timeField: 'timestamp ' },
        });
      });

      it('does not specify the _id_ index as hint', async function () {
        const spy = sinon.spy(dataService, 'aggregate');
        const listener = waitForState(store, (state) => {
          expect(state.count).to.equal(0);
        });

        void store.refreshDocuments();

        await listener;

        // the count should be the only aggregate we ran
        expect(spy.callCount).to.equal(1);
        const opts = spy.args[0][2];
        expect(opts?.hint).to.not.exist;
      });
    });

    context('when cancelling the operation', function () {
      let store: CrudStore;

      beforeEach(function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.test',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
      });

      it('aborts the queries', async function () {
        const spy = sinon.spy(dataService, 'aggregate');

        const listener = waitForStates(store, [
          (state) => {
            // cancel the operation as soon as the query starts
            expect(state.status).to.equal('fetching');
            expect(state.count).to.be.null;
            expect(state.loadingCount).to.be.true; // initially count is still loading
            expect(state.error).to.be.null;
            expect(state.abortController).to.not.be.null;

            store.cancelOperation();
          },

          (state) => {
            // cancelOperation cleans up abortController
            expect(state.abortController).to.be.null;
          },

          (state) => {
            // the operation should fail
            expect(state.status).to.equal('error');
            expect(state.error.message).to.equal('This operation was aborted');
            expect(state.abortController).to.be.null;
            expect(state.loadingCount).to.be.false; // eventually count loads
          },
        ]);

        void store.refreshDocuments();

        await listener;

        // the count should be the only aggregate we ran
        expect(spy.callCount).to.equal(1);
        const opts = spy.args[0][2];
        expect(opts?.hint).to.equal('_id_');
      });
    });
  });

  describe('#getPage', function () {
    let store: CrudStore;
    let findSpy;

    beforeEach(async function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.test',
          noRefreshOnConfigure: true,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();

      findSpy = sinon.spy(store.dataService, 'find');

      const docs = [...Array(1000).keys()].map((i) => ({ i }));
      await dataService.insertMany('compass-crud.test', docs);
    });

    afterEach(function () {
      return dataService.deleteMany('compass-crud.test', {});
    });

    it('does nothing for negative page numbers', async function () {
      await store.getPage(-1);
      expect(findSpy.called).to.be.false;
    });

    it('does nothing if documents are already being fetched', async function () {
      store.state.status = 'fetching';
      await store.getPage(1);
      expect(findSpy.called).to.be.false;
    });

    it('does nothing if the page being requested is past the end', async function () {
      store.state.query.limit = 20;
      await store.getPage(1); // there is only one page of 20
      expect(findSpy.called).to.be.false;
    });

    it('does not ask for documents past the end', async function () {
      store.state.query.limit = 21;
      await store.getPage(1); // there is only one page of 20
      expect(findSpy.called).to.be.true;
      const opts = findSpy.args[0][2];
      // the second page should only have 1 due to the limit
      expect(opts.limit).to.equal(1);
    });

    it('sets status fetchedPagination if it succeeds with no filter', async function () {
      await store.getPage(1); // there is only one page of 20
      expect(findSpy.called).to.be.true;
      expect(store.state.status).to.equal('fetchedPagination');
    });

    it('sets status fetchedPagination if it succeeds with a filter', async function () {
      store.state.query.filter = { i: { $gt: 1 } };
      await store.getPage(1); // there is only one page of 20
      expect(findSpy.called).to.be.true;
      expect(store.state.status).to.equal('fetchedPagination');
    });

    it('sets status error if it fails', async function () {
      // remove the spy and replace it with a stub
      findSpy.restore();
      const findStub = sinon
        .stub(store.dataService, 'find')
        .rejects(new Error('This is a fake error.'));

      expect(store.state.abortController).to.be.null;

      const promise = store.getPage(1);
      expect(store.state.abortController).to.not.be.null;

      await promise;
      expect(store.state.error.message).to.equal('This is a fake error.');

      expect(findStub.called).to.be.true;
    });

    it('allows the operation to be cancelled', async function () {
      expect(store.state.abortController).to.be.null;

      const promise = store.getPage(1);
      expect(store.state.abortController).to.not.be.null;

      store.cancelOperation();
      expect(store.state.abortController).to.be.null;
      expect(store.state.error).to.be.null;

      await promise;
      expect(store.state.error.message).to.equal('This operation was aborted');

      expect(findSpy.called).to.be.true;
    });
  });

  describe.skip('default query for view with own sort order', function () {
    let store: CrudStore;

    beforeEach(async function () {
      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.testview',
          noRefreshOnConfigure: true,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
      await dataService.insertMany('compass-crud.test', [
        { _id: '001', cat: 'nori' },
        { _id: '002', cat: 'chashu' },
        { _id: '003', cat: 'amy' },
        { _id: '004', cat: 'pia' },
      ]);
      await dataService.createView(
        'testview',
        'compass-crud.test',
        [{ $sort: { cat: 1 } }],
        {}
      );
    });

    afterEach(async function () {
      await dataService.deleteMany('compass-crud.test', {});
      await dataService.dropCollection('compass-crud.testview');
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

      void store.refreshDocuments();

      await listener;
    });
  });

  describe('#findAndModifyWithFLEFallback', function () {
    let dataServiceStub;
    let findFake;
    let findOneAndReplaceFake;
    let findOneAndUpdateFake;
    let updateOneFake;
    let replaceOneFake;

    const updatedDocument = { _id: 1234, name: 'document_12345' };

    beforeEach(function () {
      findFake = sinon.stub();
      findOneAndReplaceFake = sinon.stub();
      findOneAndUpdateFake = sinon.stub();
      updateOneFake = sinon.stub();
      replaceOneFake = sinon.stub();
      dataServiceStub = {
        find: findFake,
        findOneAndReplace: findOneAndReplaceFake,
        findOneAndUpdate: findOneAndUpdateFake,
        updateOne: updateOneFake,
        replaceOne: replaceOneFake,
      };
    });

    afterEach(function () {
      sinon.restore();
    });

    it('does the original findOneAndUpdate operation and nothing more if it succeeds', async function () {
      findFake.callsFake(() => Promise.resolve([]));
      findOneAndReplaceFake.resolves({});
      findOneAndUpdateFake.resolves(updatedDocument);
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'update'
      );
      expect(error).to.equal(undefined);
      expect(d).to.equal(updatedDocument);
      expect(findOneAndReplaceFake).to.have.callCount(0);
      expect(findOneAndUpdateFake).to.have.callCount(1);
      expect(findOneAndUpdateFake.firstCall.args[0]).to.equal('db.coll');
      expect(findOneAndUpdateFake.firstCall.args[1]).to.deep.equal({
        _id: 1234,
      });
      expect(findOneAndUpdateFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
      expect(findOneAndUpdateFake.firstCall.args[3]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
    });

    it('does the original findOneAndReplace operation and nothing more if it succeeds', async function () {
      findFake.callsFake(() => Promise.resolve([]));
      findOneAndReplaceFake.resolves(updatedDocument);
      findOneAndUpdateFake.resolves({});
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'replace'
      );
      expect(error).to.equal(undefined);
      expect(d).to.equal(updatedDocument);
      expect(findOneAndUpdateFake).to.have.callCount(0);
      expect(findOneAndReplaceFake).to.have.callCount(1);
      expect(findOneAndReplaceFake.firstCall.args[0]).to.equal('db.coll');
      expect(findOneAndReplaceFake.firstCall.args[1]).to.deep.equal({
        _id: 1234,
      });
      expect(findOneAndReplaceFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
      expect(findOneAndReplaceFake.firstCall.args[3]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
    });

    it('does the original findOneAndUpdate operation and nothing more if it fails with a non-FLE error', async function () {
      const err = new Error('failed');
      findFake.callsFake(() => Promise.resolve([]));
      findOneAndReplaceFake.resolves({});
      findOneAndUpdateFake.rejects(err);
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'update'
      );
      expect(error).to.equal(err);
      expect(d).to.equal(undefined);
      expect(findOneAndUpdateFake).to.have.callCount(1);
      expect(findOneAndUpdateFake.firstCall.args[0]).to.equal('db.coll');
      expect(findOneAndUpdateFake.firstCall.args[1]).to.deep.equal({
        _id: 1234,
      });
      expect(findOneAndUpdateFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
      expect(findOneAndUpdateFake.firstCall.args[3]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });
    });

    it('does updateOne with FLE returnDocument: "after"', async function () {
      const err = Object.assign(new Error('failed'), { code: 6371402 });
      findFake.callsFake(() => Promise.resolve([updatedDocument]));
      findOneAndReplaceFake.resolves({});
      findOneAndUpdateFake.onCall(0).rejects(err);
      updateOneFake.onCall(0).resolves({});
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'update'
      );
      expect(error).to.equal(undefined);
      expect(d).to.deep.equal(updatedDocument);
      expect(findOneAndUpdateFake).to.have.callCount(1);

      expect(findOneAndUpdateFake.firstCall.args[0]).to.equal('db.coll');
      expect(findOneAndUpdateFake.firstCall.args[1]).to.deep.equal({
        _id: 1234,
      });
      expect(findOneAndUpdateFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
      expect(findOneAndUpdateFake.firstCall.args[3]).to.deep.equal({
        returnDocument: 'after',
        promoteValues: false,
      });

      expect(updateOneFake.firstCall.args[0]).to.equal('db.coll');
      expect(updateOneFake.firstCall.args[1]).to.deep.equal({
        _id: 1234,
      });
      expect(updateOneFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });

      expect(findFake).to.have.callCount(1);
      expect(findFake.firstCall.args[0]).to.equal('db.coll');
      expect(findFake.firstCall.args[1]).to.deep.equal({ _id: 1234 });
      expect(findFake.firstCall.args[2]).to.deep.equal({
        promoteValues: false,
      });
    });

    it('returns the original error if the fallback find operation fails', async function () {
      const err = Object.assign(new Error('failed'), { code: 6371402 });
      findFake.yields(new Error('find failed'));
      findOneAndReplaceFake.resolves({});
      findOneAndUpdateFake.onCall(0).rejects(err);
      updateOneFake.onCall(0).resolves({});
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'update'
      );
      expect(error).to.equal(err);
      expect(d).to.equal(undefined);
      expect(findOneAndUpdateFake).to.have.callCount(1);
      expect(updateOneFake).to.have.callCount(1);
      expect(findFake).to.have.callCount(1);
    });

    it('calls updateOne if findOneAndUpdate returns the ShardKeyNotFound error', async function () {
      const err = Object.assign(
        new Error('Query for sharded findAndModify must contain the shard key'),
        { codeName: 'ShardKeyNotFound' }
      );
      findFake.callsFake(() => Promise.resolve([updatedDocument]));
      findOneAndReplaceFake.resolves({});
      findOneAndUpdateFake.rejects(err);
      updateOneFake.resolves(updatedDocument);
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'update'
      );
      expect(error).to.equal(undefined);
      expect(d).to.equal(updatedDocument);
      expect(findOneAndUpdateFake).to.have.callCount(1);
      expect(updateOneFake).to.have.callCount(1);
      expect(updateOneFake.firstCall.args[0]).to.equal('db.coll');
      expect(updateOneFake.firstCall.args[1]).to.deep.equal({ _id: 1234 });
      expect(updateOneFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
    });

    it('calls replaceOne if findOneAndReplace returns the ShardKeyNotFound error', async function () {
      const err = Object.assign(
        new Error('Query for sharded findAndModify must contain the shard key'),
        { codeName: 'ShardKeyNotFound' }
      );
      findFake.callsFake(() => Promise.resolve([updatedDocument]));
      findOneAndReplaceFake.rejects(err);
      findOneAndUpdateFake.resolves({});
      replaceOneFake.resolves(updatedDocument);
      const [error, d] = await findAndModifyWithFLEFallback(
        dataServiceStub,
        'db.coll',
        { _id: 1234 } as any,
        { name: 'document_12345' },
        'replace'
      );
      expect(error).to.equal(undefined);
      expect(d).to.equal(updatedDocument);
      expect(findOneAndReplaceFake).to.have.callCount(1);
      expect(replaceOneFake).to.have.callCount(1);
      expect(replaceOneFake.firstCall.args[0]).to.equal('db.coll');
      expect(replaceOneFake.firstCall.args[1]).to.deep.equal({ _id: 1234 });
      expect(replaceOneFake.firstCall.args[2]).to.deep.equal({
        name: 'document_12345',
      });
    });
  });

  describe('fetchDocuments', function () {
    let findResult: unknown[] = [];
    let csfleMode = 'disabled';
    let find = sinon.stub().callsFake(() => {
      return Promise.resolve(findResult);
    });
    const dataService = {
      get find() {
        return find;
      },
      getCSFLEMode() {
        return csfleMode;
      },
    } as unknown as DataService;
    class MongoServerError extends Error {
      name = 'MongoServerError';
    }

    afterEach(function () {
      csfleMode = 'disabled';
      findResult = [];
      find = sinon.stub().callsFake(() => {
        return Promise.resolve(findResult);
      });
      find.resetHistory();
    });

    it('should call find with $bsonSize projection when mongodb version is >= 4.4, not connected to ADF and csfle is disabled', async function () {
      await fetchDocuments(dataService, '5.0.0', false, 'test.test', {});
      expect(find).to.have.been.calledOnce;
      expect(find.getCall(0))
        .to.have.nested.property('args.2.projection')
        .deep.eq({ _id: 0, __doc: '$$ROOT', __size: { $bsonSize: '$$ROOT' } });
    });

    it('should return hadron documents with size set if $bsonSize projection is supported', async function () {
      findResult = [{ __size: new Int32(42), __doc: { _id: 1 } }];
      const docs = await fetchDocuments(
        dataService,
        '4.0.0',
        false,
        'test.test',
        {}
      );
      expect(docs[0]).to.be.instanceOf(HadronDocument);
      expect(docs[0]).to.have.property('size', 42);
      expect(docs[0].getId()).to.have.property('value', 1);
    });

    it('should NOT call find with $bsonSize projection when mongodb version is < 4.4', async function () {
      await fetchDocuments(dataService, '4.0.0', false, 'test.test', {});
      expect(find).to.have.been.calledOnce;
      expect(find.getCall(0)).to.have.nested.property(
        'args.2.projection',
        undefined
      );
    });

    it('should NOT call find with $bsonSize projection when connected to ADF', async function () {
      await fetchDocuments(dataService, '5.0.0', true, 'test.test', {});
      expect(find).to.have.been.calledOnce;
      expect(find.getCall(0)).to.have.nested.property(
        'args.2.projection',
        undefined
      );
    });

    it('should NOT call find with $bsonSize projection when csfle is enabled', async function () {
      csfleMode = 'enabled';
      await fetchDocuments(dataService, '5.0.0', false, 'test.test', {});
      expect(find).to.have.been.calledOnce;
      expect(find.getCall(0)).to.have.nested.property(
        'args.2.projection',
        undefined
      );
    });

    it('should keep user projection when provided', async function () {
      await fetchDocuments(
        dataService,
        '5.0.0',
        false,
        'test.test',
        {},
        {
          projection: { _id: 1 },
        }
      );
      expect(find).to.have.been.calledOnce;
      expect(find.getCall(0))
        .to.have.nested.property('args.2.projection')
        .deep.eq({ _id: 1 });
    });

    it('should retry find operation if failed with server error when applying custom projection', async function () {
      find = sinon
        .stub()
        .onFirstCall()
        .rejects(new MongoServerError('Failed'))
        .onSecondCall()
        .resolves([{ _id: 1 }]);

      const docs = await fetchDocuments(
        dataService,
        '5.0.0',
        false,
        'test.test',
        {}
      );

      expect(find).to.have.been.calledTwice;
      expect(find.getCall(0))
        .to.have.nested.property('args.2.projection')
        .deep.eq({ _id: 0, __doc: '$$ROOT', __size: { $bsonSize: '$$ROOT' } });
      expect(find.getCall(1)).to.have.nested.property('args.2', undefined);

      expect(docs[0]).to.be.instanceOf(HadronDocument);
      expect(docs[0].getId()).to.have.property('value', 1);
    });

    it('should NOT retry find operation if it failed for any other reason', async function () {
      find = sinon.stub().rejects(new TypeError('🤷‍♂️'));

      try {
        await fetchDocuments(dataService, '5.0.0', false, 'test.test', {});
        expect.fail('Expected fetchDocuments to fail with error');
      } catch (err) {
        expect(find).to.have.been.calledOnce;
        expect(err).to.be.instanceOf(TypeError);
      }
    });

    it("should NOT retry find operation even for server errors if bsonSize projection wasn't applied", async function () {
      find = sinon.stub().rejects(new MongoServerError('Nope'));

      try {
        await fetchDocuments(dataService, '3.0.0', true, 'test.test', {});
        expect.fail('Expected fetchDocuments to fail with error');
      } catch (err) {
        expect(find).to.have.been.calledOnce;
        expect(err).to.be.instanceOf(MongoServerError);
      }
    });
  });

  describe('saveUpdateQuery', function () {
    const favoriteQueriesStorage = new FavoriteQueryStorage();

    let saveQueryStub;
    let store: CrudStore;

    beforeEach(function () {
      saveQueryStub = sinon.stub().resolves();
      favoriteQueriesStorage.saveQuery = saveQueryStub;

      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.testview',
          noRefreshOnConfigure: true,
          favoriteQueriesStorage: favoriteQueriesStorage,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    it('should save the query once is submitted to save', async function () {
      store.onQueryChanged({ filter: { field: 1 } });
      await store.updateBulkUpdatePreview('{ $set: { anotherField: 2 } }');
      await store.saveUpdateQuery('my-query');

      expect(saveQueryStub).to.have.been.calledWith({
        _name: 'my-query',
        _ns: 'compass-crud.testview',
        filter: {
          field: 1,
        },
        update: {
          $set: { anotherField: 2 },
        },
      });
    });
  });

  describe('updateBulkUpdatePreview', function () {
    context('with isUpdatePreviewSupported=false', function () {
      let previewUpdateStub;
      let store: CrudStore;

      beforeEach(function () {
        previewUpdateStub = sinon.stub().resolves({
          changes: [
            {
              before: {},
              after: {},
            },
          ],
        });
        dataService.previewUpdate = previewUpdateStub;
        instance.topologyDescription.type = 'Single';
      });
      beforeEach(function () {
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.testview',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
      });

      it('never calls dataService.previewUpdate()', async function () {
        void store.openBulkUpdateDialog();
        store.onQueryChanged({ filter: { field: 1 } });
        await store.updateBulkUpdatePreview('{ $set: { anotherField: 2 } }');

        expect(previewUpdateStub.called).to.be.false;

        expect(store.state.bulkUpdate).to.deep.equal({
          isOpen: true,
          preview: {
            changes: [],
          },
          serverError: undefined,
          syntaxError: undefined,
          updateText: '{ $set: { anotherField: 2 } }',
        });
      });
    });

    context('with isUpdatePreviewSupported=true', function () {
      let previewUpdateStub;
      let store: CrudStore;

      beforeEach(function () {
        previewUpdateStub = sinon.stub().resolves({
          changes: [
            {
              before: {},
              after: {},
            },
          ],
        });
        dataService.previewUpdate = previewUpdateStub;
        instance.topologyDescription.type = 'Unknown'; // anything not 'Single'
        const plugin = activateDocumentsPlugin(
          {
            isSearchIndexesSupported: true,
            isReadonly: false,
            isTimeSeries: false,
            namespace: 'compass-crud.testview',
            noRefreshOnConfigure: true,
          },
          {
            dataService,
            localAppRegistry,
            globalAppRegistry,
            instance,
          }
        );
        store = plugin.store;
        deactivate = () => plugin.deactivate();
      });

      it('calls dataService.previewUpdate()', async function () {
        void store.openBulkUpdateDialog();
        store.onQueryChanged({ filter: { field: 1 } });
        await store.updateBulkUpdatePreview('{ $set: { anotherField: 2 } }');

        // why two? because it also gets called when the dialog opens
        expect(previewUpdateStub.callCount).to.equal(2);

        expect(store.state.bulkUpdate).to.deep.equal({
          isOpen: true,
          preview: {
            changes: [
              {
                before: {},
                after: {},
              },
            ],
          },
          previewAbortController: undefined,
          serverError: undefined,
          syntaxError: undefined,
          updateText: '{ $set: { anotherField: 2 } }',
        });
      });
    });
  });

  describe('saveRecentQueryQuery', function () {
    const recentQueriesStorage = new RecentQueryStorage();

    let saveQueryStub;
    let store: CrudStore;

    beforeEach(function () {
      saveQueryStub = sinon.stub().resolves();
      recentQueriesStorage.saveQuery = saveQueryStub;

      const plugin = activateDocumentsPlugin(
        {
          isSearchIndexesSupported: true,
          isReadonly: false,
          isTimeSeries: false,
          namespace: 'compass-crud.testview',
          noRefreshOnConfigure: true,
          recentQueriesStorage: recentQueriesStorage,
        },
        {
          dataService,
          localAppRegistry,
          globalAppRegistry,
          instance,
        }
      );
      store = plugin.store;
      deactivate = () => plugin.deactivate();
    });

    it('should save the query once is run', async function () {
      store.onQueryChanged({ filter: { field: 1 } });
      await store.updateBulkUpdatePreview('{ $set: { anotherField: 2 } }');
      await store.runBulkUpdate();

      expect(saveQueryStub).to.have.been.calledWith({
        _ns: 'compass-crud.testview',
        filter: {
          field: 1,
        },
        update: {
          $set: { anotherField: 2 },
        },
      });
    });
  });
});
