/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const QueryStore = require('../src/internal-packages/query/lib/store/query-store');
const QueryChangedStore = require('../src/internal-packages/query/lib/store/query-changed-store');
const sinon = require('sinon');

describe('QueryChangedStore', () => {
  let unsubscribe;

  afterEach(() => {
    unsubscribe();
    QueryStore.setState(QueryStore.getInitialState());
  });

  it('triggers when the QueryStore lastExecutedQuery variable changes', (done) => {
    unsubscribe = QueryChangedStore.listen((state) => {
      expect(state.query).to.be.deep.equal({foo: 1});
      done();
    });
    QueryStore.setQuery({foo: 1});
    QueryStore.apply();
  });

  it('does not trigger when the QueryStore lastExecutedQuery variable remains the same', (done) => {
    const spy = sinon.spy();
    unsubscribe = QueryChangedStore.listen(spy);
    QueryStore.setQuery({foo: 1});
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
    QueryStore.setQuery({foo: 1});
    setTimeout(() => {
      expect(spy.called).to.be.false;
      done();
    }, 50);
  });
});
