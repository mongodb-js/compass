const { expect } = require('chai');
const Connection = require('mongodb-connection-model');
const DataService = require('mongodb-data-service');
const AppRegistry = require('hadron-app-registry');
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
      expect(CRUDStore.state.documents).to.deep.equal([]);
    });

    it('sets the default count', () => {
      expect(CRUDStore.state.count).to.equal(0);
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
        expect(state.documents).to.deep.equal([]);
        expect(state.count).to.equal(0);
        unsubscribe();
        done();
      });

      CRUDStore.onQueryChanged(query);
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
        expect(state.documents).to.deep.equal([]);
        expect(state.count).to.equal(0);
        unsubscribe();
        done();
      });

      global.hadronApp.appRegistry.emit('query-changed', query);
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
          expect(state.documents).to.have.length(1);
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
          expect(state.documents).to.have.length(0);
          expect(state.count).to.equal(0);
          unsubscribe();
          done();
        });

        CRUDStore.resetDocuments();
      });
    });
  });
});
