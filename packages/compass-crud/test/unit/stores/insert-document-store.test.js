const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
const InsertDocumentStore = require('../../../lib/stores/insert-document-store');

const CONNECTION = new Connection({
  hostname: '127.0.0.1',
  port: 27018,
  ns: 'compass-crud-test'
});

describe('InsertDocumentStore', () => {
  const dataService = new DataService(CONNECTION);

  before((done) => {
    global.hadronApp.appRegistry = new AppRegistry();
    global.hadronApp.appRegistry.registerStore('CRUD.Store', InsertDocumentStore);
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

  describe('#init', () => {
    it('sets the default filter', () => {
      expect(InsertDocumentStore.filter).to.deep.equal({});
    });
  });

  describe('#onCollectionChanged', () => {
    before(() => {
      InsertDocumentStore.onCollectionChanged('compass-crud.test');
    });

    after(() => {
      InsertDocumentStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(InsertDocumentStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#emit collection-changed', () => {
    before(() => {
      global.hadronApp.appRegistry.emit('collection-changed', 'compass-crud.test');
    });

    after(() => {
      InsertDocumentStore.onCollectionChanged(undefined);
    });

    it('sets the namespace', () => {
      expect(InsertDocumentStore.ns).to.equal('compass-crud.test');
    });
  });

  describe('#onQueryChanged', () => {
    const filter = { name: 'test' };
    before(() => {
      InsertDocumentStore.onQueryChanged({ ns: 'compass-crud.test', filter: filter });
    });

    after(() => {
      InsertDocumentStore.onQueryChanged({ ns: 'compass-crud.test', filter: {}});
    });

    it('sets the filter', () => {
      expect(InsertDocumentStore.filter).to.deep.equal(filter);
    });
  });

  describe('#emit query-changed', () => {
    const filter = { name: 'test' };
    before(() => {
      global.hadronApp.appRegistry.emit('query-changed', { ns: 'compass-crud.test', filter: filter });
    });

    after(() => {
      InsertDocumentStore.onQueryChanged({ ns: 'compass-crud.test', filter: {}});
    });

    it('sets the filter', () => {
      expect(InsertDocumentStore.filter).to.deep.equal(filter);
    });
  });

  describe('#insertDocument', () => {
    context('when the document matches the filter', () => {
      const doc = { name: 'test' };
      before(() => {
        InsertDocumentStore.onCollectionChanged('compass-crud.test');
      });

      it('triggers with the inserted document', (done) => {
        const unsubscribe = InsertDocumentStore.listen((error, d) => {
          expect(error).to.equal(null);
          expect(d).to.deep.equal(doc);
          dataService.deleteOne('compass-crud.test', { _id: doc._id }, {}, () => {
            unsubscribe();
            done();
          });
        });
        InsertDocumentStore.insertDocument(doc);
      });
    });
  });
});
