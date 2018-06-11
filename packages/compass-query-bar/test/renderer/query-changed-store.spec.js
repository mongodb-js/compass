/* eslint-disable no-unused-expressions */

import { QueryBarStore, QueryChangedStore } from 'stores';
import AppRegistry from 'hadron-app-registry';

describe('QueryChangedStore [Store]', function() {
  const registry = new AppRegistry();
  const historyActions = {
    runQuery: {
      listen: () => {}
    }
  };
  let unsubscribe;

  before(function() {
    registry.registerStore('QueryBarStore', QueryBarStore);
    registry.registerAction('QueryHistory.Actions', historyActions);
    registry.onActivated();
  });

  beforeEach(function() {
    unsubscribe = () => {};
    QueryBarStore.setState( QueryBarStore.getInitialState() );
  });

  afterEach(function() {
    unsubscribe();
  });

  it('returns the extended query properties for its initial state', () => {
    const keys = QueryChangedStore.getInitialState();
    expect(keys).to.have.all.keys(['filter', 'project', 'sort', 'skip',
      'limit', 'sample', 'maxTimeMS', 'queryState', 'ns']);
  });

  it('detects if there was a change in lastExecutedQuery', () => {
    expect(QueryChangedStore._detectChange({lastExecutedQuery: {filter: {foo: 1}}})).to.be.true;
  });

  it('detects if there was no change in lastExecutedQuery', () => {
    expect(QueryChangedStore._detectChange({lastExecutedQuery: {}})).to.be.true;
  });

  it('triggers when the QueryBarStore lastExecutedQuery variable changes', (done) => {
    QueryBarStore.setQuery({filter: {foo: 1}});

    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.filter).to.be.deep.equal({foo: 1});
      done();
    });

    QueryBarStore.apply();
  });

  it('triggers when the QueryBarStore sample variable changes', (done) => {
    expect(QueryBarStore.state.sample).to.be.false;

    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.sample).to.be.true;
      done();
    });

    QueryBarStore.setQuery({sample: true});
    QueryBarStore.apply();
  });

  it('contains all the other query options', (done) => {
    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.filter).to.be.deep.equal({foo: 1});
      expect(state.sort).to.be.deep.equal(null);
      expect(state.skip).to.be.equal(0);
      expect(state.limit).to.be.equal(0);
      expect(state.project).to.be.deep.equal(null);
      expect(state.sample).to.be.false;
      expect(state.maxTimeMS).to.be.equal(10000);
      done();
    });

    QueryBarStore.setQuery({filter: {foo: 1}});
    QueryBarStore.apply();
  });

  it('does not trigger when the QueryBarStore lastExecutedQuery variable remains the same', (done) => {
    const spy = sinon.spy();
    unsubscribe = QueryChangedStore.listen(spy);

    QueryBarStore.setQuery({filter: {foo: 1}});
    QueryBarStore.apply();
    QueryBarStore.apply();

    setTimeout(() => {
      expect(spy.callCount).to.be.equal(1);
      done();
    }, 50);
  });

  it('does not trigger when other variables of the QueryBarStore change', (done) => {
    const spy = sinon.spy();
    unsubscribe = QueryChangedStore.listen(spy);

    QueryBarStore.setQuery({filter: {foo: 1}});

    setTimeout(() => {
      expect(spy.called).to.be.false;
      done();
    }, 50);
  });
});

/* eslint-enable no-unused-expressions */
