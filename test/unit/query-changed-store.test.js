/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const sinon = require('sinon');
const mock = require('mock-require');

// const debug = require('debug')('mongodb-compass:test:query-changed-store');

let QueryStore = require('../../src/internal-packages/query/lib/store/query-store');
let QueryChangedStore = require('../../src/internal-packages/query/lib/store/query-changed-store');

describe('QueryChangedStore', () => {
  let unsubscribe = () => {};

  before(() => {
    mock('../../src/internal-packages/indexes/lib/action/index-actions', {
      loadIndexes: sinon.spy()
    });
    QueryStore = mock.reRequire('../../src/internal-packages/query/lib/store/query-store');
    QueryChangedStore = mock.reRequire('../../src/internal-packages/query/lib/store/query-changed-store');
  });

  afterEach(() => {
    unsubscribe();
    unsubscribe = () => {};
    QueryStore.setState(QueryStore.getInitialState());
  });

  after(() => {
    mock.stopAll();
    mock.reRequire('../../src/internal-packages/indexes/lib/action/index-actions');
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

  it('triggers when the QueryStore lastExecutedQuery variable changes', (done) => {
    QueryStore.setQuery({filter: {foo: 1}});
    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.filter).to.be.deep.equal({foo: 1});
      done();
    });
    QueryStore.apply();
  });

  it('triggers when the QueryStore sample variable changes', (done) => {
    expect(QueryStore.state.sample).to.be.false;
    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.sample).to.be.true;
      done();
    });
    QueryStore.setQuery({sample: true});
    QueryStore.apply();
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
    QueryStore.setQuery({filter: {foo: 1}});
    QueryStore.apply();
  });

  it('does not trigger when the QueryStore lastExecutedQuery variable remains the same', (done) => {
    const spy = sinon.spy();
    unsubscribe = QueryChangedStore.listen(spy);
    QueryStore.setQuery({filter: {foo: 1}});
    QueryStore.apply();
    QueryStore.apply();
    setTimeout(() => {
      expect(spy.callCount).to.be.equal(1);
      done();
    }, 50);
  });

  it('does not trigger when other variables of the QueryStore change', (done) => {
    const spy = sinon.spy();
    unsubscribe = QueryChangedStore.listen(spy);
    QueryStore.setQuery({filter: {foo: 1}});
    setTimeout(() => {
      expect(spy.called).to.be.false;
      done();
    }, 50);
  });
});
