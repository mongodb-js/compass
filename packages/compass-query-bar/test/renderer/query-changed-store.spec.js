/* eslint-disable no-unused-expressions */

import configureStore from '../../src/stores/query-changed-store';
import configureQueryBarStore from '../../src/stores';
import configureActions from '../../src/actions';
import AppRegistry from 'hadron-app-registry';

describe('QueryChangedStore [Store]', function() {
  context('without a data provider', () => {
    let unsubscribe;
    let actions;
    let store;
    let queryBarStore;

    beforeEach(function() {
      unsubscribe = () => {};
      actions = configureActions();
      queryBarStore = configureQueryBarStore({
        actions: actions
      });
      store = configureStore({
        actions: actions,
        store: queryBarStore
      });
    });

    afterEach(function() {
      actions = null;
      store = null;
      queryBarStore = null;
      unsubscribe();
    });

    it('returns the extended query properties for its initial state', () => {
      const keys = store.getInitialState();
      expect(keys).to.have.all.keys(['filter', 'project', 'sort', 'skip',
        'limit', 'sample', 'maxTimeMS', 'queryState', 'ns', 'collation']);
    });

    it('detects if there was a change in lastExecutedQuery', () => {
      expect(store._detectChange({lastExecutedQuery: {filter: {foo: 1}}})).to.be.true;
    });

    it('detects if there was no change in lastExecutedQuery', () => {
      expect(store._detectChange({lastExecutedQuery: {}})).to.be.true;
    });

    it('triggers when the queryBarStore lastExecutedQuery variable changes', (done) => {
      queryBarStore.setQuery({filter: {foo: 1}});

      unsubscribe = store.listen((state) => {
        expect(state.filter).to.be.deep.equal({foo: 1});
        done();
      });

      queryBarStore.apply();
    });

    it('triggers when the queryBarStore sample variable changes', (done) => {
      expect(queryBarStore.state.sample).to.be.false;

      unsubscribe = store.listen((state) => {
        expect(state.sample).to.be.true;
        done();
      });

      queryBarStore.setQuery({sample: true});
      queryBarStore.apply();
    });

    it('contains all the other query options', (done) => {
      unsubscribe = store.listen((state) => {
        expect(state.filter).to.be.deep.equal({foo: 1});
        expect(state.sort).to.be.deep.equal(null);
        expect(state.skip).to.be.equal(0);
        expect(state.limit).to.be.equal(0);
        expect(state.project).to.be.deep.equal(null);
        expect(state.collation).to.be.deep.equal(null);
        expect(state.sample).to.be.false;
        expect(state.maxTimeMS).to.be.equal(60000);
        done();
      });

      queryBarStore.setQuery({filter: {foo: 1}});
      queryBarStore.apply();
    });

    it('does not trigger when the queryBarStore lastExecutedQuery variable remains the same', (done) => {
      const spy = sinon.spy();
      unsubscribe = store.listen(spy);

      queryBarStore.setQuery({filter: {foo: 1}});
      queryBarStore.apply();
      queryBarStore.apply();

      setTimeout(() => {
        expect(spy.callCount).to.be.equal(1);
        done();
      }, 50);
    });

    it('does not trigger when other variables of the queryBarStore change', (done) => {
      const spy = sinon.spy();
      unsubscribe = store.listen(spy);

      queryBarStore.setQuery({filter: {foo: 1}});

      setTimeout(() => {
        expect(spy.called).to.be.false;
        done();
      }, 50);
    });
  });

  context('with a data provider', () => {
    const appRegistry = new AppRegistry();
    let unsubscribe;
    let store;
    let queryBarStore;
    let dataService;
    let nsdb;
    let nscall;

    beforeEach(function() {
      unsubscribe = () => {};
      dataService = {
        listCollections: function(db, call, callback) {
          nsdb = db;
          nscall = call;
          callback([{}]);
        }
      };
      queryBarStore = configureQueryBarStore({
        dataProvider: {
          error: null,
          dataProvider: dataService,
        },
        namespace: 'db.coll'
      });
      store = configureStore({
        store: queryBarStore,
        globalAppRegistry: appRegistry
      });
    });

    afterEach(function() {
      store = null;
      queryBarStore = null;
      unsubscribe();
    });

    it('fetches collection info for telemetry', (done) => {
      unsubscribe = store.listen(() => {
        expect(nsdb).to.be.equal('db');
        expect(nscall).to.be.deep.equal({ name: 'coll' });
        done();
      });

      queryBarStore.apply();
    });
  });
});

/* eslint-enable no-unused-expressions */
