/* eslint no-unused-expressions: 0 */

const expect = require('chai').expect;
const assert = require('assert');
const mock = require('mock-require');
const sinon = require('sinon');

let QueryStore;

// const debug = require('debug')('mongodb-compass:test:query-store')

describe('QueryStore', () => {
  let unsubscribe;

  before(() => {
    mock('../../src/internal-plugins/indexes/lib/action/index-actions', {
      loadIndexes: sinon.spy()
    });
    QueryStore = mock.reRequire(
      '../../src/internal-plugins/query/lib/store/query-store'
    );
  });

  after(() => {
    mock.stopAll();
    mock.reRequire(
      '../../src/internal-plugins/indexes/lib/action/index-actions'
    );
  });

  // reset query store to initial state
  afterEach(() => {
    unsubscribe();
    unsubscribe = () => {};
    QueryStore.setState(QueryStore.getInitialState());
  });

  describe('toggleQueryOptions', () => {
    it('sets expanded to true when calling it once', done => {
      expect(QueryStore.state.expanded).to.be.false;
      unsubscribe = QueryStore.listen(state => {
        expect(state.expanded).to.be.true;
        done();
      });
      QueryStore.toggleQueryOptions();
    });

    it('sets expanded back to false when calling it twice', done => {
      expect(QueryStore.state.expanded).to.be.false;
      QueryStore.toggleQueryOptions();
      unsubscribe = QueryStore.listen(state => {
        expect(state.expanded).to.be.false;
        done();
      });
      QueryStore.toggleQueryOptions();
    });
  });

  describe('valid', () => {
    context('when using setQuery', () => {
      it('updates its valid state for an invalid query', done => {
        expect(QueryStore.state.valid).to.be.true;
        unsubscribe = QueryStore.listen(state => {
          expect(state.valid).to.be.false;
          done();
        });
        QueryStore.setQuery({ skip: 'invalid', sort: { foo: 1 } });
      });
      it('updates its valid state for a valid query', done => {
        QueryStore.setQuery({ skip: 'invalid', sort: { foo: 1 } });
        unsubscribe = QueryStore.listen(state => {
          expect(state.valid).to.be.true;
          done();
        });
        QueryStore.setQuery({ skip: 3, sort: { foo: 1 } });
      });
    });
    context('when using setQueryString', () => {
      it('updates its valid state for an invalid query', done => {
        expect(QueryStore.state.valid).to.be.true;
        unsubscribe = QueryStore.listen(state => {
          expect(state.valid).to.be.false;
          done();
        });
        QueryStore.setQueryString('skip', 'invalid');
      });
    });
  });

  describe('_cloneQuery', () => {
    it('returns a clone of the current query', done => {
      const query = {
        filter: { a: { $exists: true } },
        project: { b: 1 },
        sort: { c: -1, d: 1 },
        skip: 5,
        limit: 10,
        sample: false
      };
      unsubscribe = QueryStore.listen(() => {
        const cloned = QueryStore._cloneQuery();
        // different object
        expect(cloned).to.not.be.equal(query);
        // same content
        expect(cloned).to.be.deep.equal(query);
        done();
      });
      QueryStore.setQuery(query);
    });
  });

  describe('_validateFeatureFlag', () => {
    it('accepts a valid feature flag', () => {
      QueryStore.validFeatureFlags = [
        'rocketLauncher',
        'laserWeapon',
        'turboBoost'
      ];
      const res = QueryStore._validateFeatureFlag('enable rocketLauncher');
      expect(res[1]).to.be.equal('enable');
      expect(res[2]).to.be.equal('rocketLauncher');
    });
    it('rejects an invalid query sort', () => {
      const res = QueryStore._validateFeatureFlag('{foo: 1}');
      expect(res).to.be.false;
    });
  });

  describe('setQuery', () => {
    context('when setting a single query property', () => {
      it('sets a new `filter`', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.filter).to.be.deep.equal({ foo: 1 });
          expect(state.filterString).to.be.equal('{foo: 1}');
          expect(state.filterValid).to.be.true;
          done();
        });
        QueryStore.setQuery({ filter: { foo: 1 } });
      });
      it('sets a new `project`', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.project).to.be.deep.equal({ _id: 0 });
          expect(state.projectString).to.be.equal('{_id: 0}');
          expect(state.projectValid).to.be.true;
          done();
        });
        QueryStore.setQuery({ project: { _id: 0 } });
      });
      it('sets a new `sort`', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.sort).to.be.deep.equal({ foo: -1 });
          expect(state.sortString).to.be.equal('{foo: -1}');
          expect(state.sortValid).to.be.true;
          done();
        });
        QueryStore.setQuery({ sort: { foo: -1 } });
      });
      it('sets a new `skip`', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.skip).to.be.deep.equal(101);
          expect(state.skipString).to.be.equal('101');
          expect(state.skipValid).to.be.true;
          done();
        });
        QueryStore.setQuery({ skip: 101 });
      });
      it('sets a new `limit`', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.limit).to.be.deep.equal(3);
          expect(state.limitString).to.be.equal('3');
          expect(state.limitValid).to.be.true;
          done();
        });
        QueryStore.setQuery({ limit: 3 });
      });
      it('sets a new `sample` to true', (done) => {
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.sampleValid).to.be.true;
          done();
        });
        QueryStore.setQuery({sample: true});
      });
      it('sets a new `sample` to false', (done) => {
        QueryStore.setQuery({sample: true});
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.false;
          expect(state.sampleValid).to.be.true;
          done();
        });
        QueryStore.setQuery({sample: false});
      });
    });
    context('when setting multiple query properties', () => {
      it('sets all state fields correctly', done => {
        unsubscribe = QueryStore.listen(state => {
          expect(state.limit).to.be.equal(0);
          expect(state.limitString).to.be.equal('false');
          expect(state.limitValid).to.be.false;
          expect(state.sort).to.be.deep.equal({ field: -1 });
          expect(state.sortString).to.be.equal('{field: -1}');
          expect(state.sortValid).to.be.true;
          expect(state.filter).to.be.deep.equal({ a: { $exists: true } });
          expect(state.filterString).to.be.equal('{a: {$exists: true}}');
          expect(state.filterValid).to.be.true;
          done();
        });
        QueryStore.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });
      });
    });
    context('when using toggleSample', () => {
      it('toggles the sample boolean value if no arguments are passed', (done) => {
        QueryStore.state.sample = false;
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });
        QueryStore.toggleSample();
      });
      it('sets the sample to true if true is passed in', (done) => {
        QueryStore.state.sample = true;
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });
        QueryStore.toggleSample(true);
      });
      it('sets the sample to false if false is passed in', (done) => {
        QueryStore.state.sample = true;
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.false;
          done();
        });
        QueryStore.toggleSample(false);
      });
      it('sets the limit to 1000 if sample is true and limit is 0', (done) => {
        QueryStore.state.sample = false;
        QueryStore.state.limit = 0;
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(1000);
          expect(state.limitString).to.be.equal('1000');
          expect(state.limitValid).to.be.true;
          done();
        });
        QueryStore.toggleSample(true);
      });
      it('leaves the limit as is if sample is true and limit is not 0', (done) => {
        QueryStore.state.sample = false;
        QueryStore.state.limit = 123;
        unsubscribe = QueryStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(123);
          done();
        });
        QueryStore.toggleSample(true);
      });
    });
    context('when passing no query object', () => {
      it('sets the default query values', done => {
        QueryStore.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });
        expect(QueryStore._cloneQuery()).to.not.deep.equal(
          QueryStore._getDefaultQuery()
        );
        unsubscribe = QueryStore.listen(() => {
          expect(QueryStore._cloneQuery()).to.deep.equal(
            QueryStore._getDefaultQuery()
          );
          done();
        });
        QueryStore.setQuery();
      });
    });
  });

  describe('apply', () => {
    describe('with a valid query', () => {
      it('sets queryState to active and sets the lastExecuteQuery', done => {
        QueryStore.setQuery({ limit: 3, filter: { foo: 'bar' } });
        unsubscribe = QueryStore.listen(state => {
          expect(state.lastExecutedQuery.limit).to.be.equal(3);
          expect(state.lastExecutedQuery.filter).to.be.deep.equal({
            foo: 'bar'
          });
          expect(state.lastExecutedQuery.skip).to.be.equal(0);
          expect(state.queryState).to.be.equal('apply');
          expect(state.valid).to.be.true;
          done();
        });
        QueryStore.apply();
      });
    });
    describe('with an invalid query', () => {
      it('does not set lastExecuteQuery or queryState', done => {
        QueryStore.setQuery({ limit: 'invalid', filter: { foo: 'bar' } });
        QueryStore.apply();
        setTimeout(() => {
          expect(QueryStore.state.lastExecutedQuery).to.be.null;
          expect(QueryStore.state.queryState).to.be.equal('reset');
          done();
        }, 10);
      });
    });
  });

  describe('reset', () => {
    describe('when the current query is the default query', () => {
      it('does not trigger the store', done => {
        unsubscribe = QueryStore.listen(() => {
          assert.fail(0, 1, 'Should not have triggered the store.');
        });
        setTimeout(() => {
          done();
        });
        QueryStore.reset();
      });
    });
    describe('when the current query is different to the default', () => {
      it('resets the query to the default', done => {
        QueryStore.setQuery({ limit: 4, filter: { foo: 'bar' } });
        unsubscribe = QueryStore.listen(() => {
          expect(QueryStore._cloneQuery()).to.be.deep.equal(
            QueryStore._getDefaultQuery()
          );
          done();
        });
        QueryStore.reset();
      });
    });
    describe('when the both query and lastExecutedQuery have been changed', () => {
      it('resets the query to the default', done => {
        QueryStore.setQuery({ limit: 4, filter: { foo: 'bar' } });
        QueryStore.apply();
        unsubscribe = QueryStore.listen(() => {
          expect(QueryStore._cloneQuery()).to.be.deep.equal(
            QueryStore._getDefaultQuery()
          );
          expect(QueryStore.state.lastExecutedQuery).to.be.deep.null;
          expect(QueryStore.state.queryState).to.be.equal('reset');
          done();
        });
        QueryStore.reset();
      });
    });
  });

  describe('typeQueryString', () => {
    it('should pass through `userTyping` to the state', done => {
      expect(QueryStore.state.userTyping).to.be.false;
      unsubscribe = QueryStore.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });
      QueryStore.typeQueryString('filter', '{foo: 1}');
    });
    it('should set `userTyping` back to false after 100ms', done => {
      expect(QueryStore.state.userTyping).to.be.false;
      QueryStore.typeQueryString('filter', '{foo: 1}');
      setTimeout(() => {
        expect(QueryStore.state.userTyping).to.be.false;
        done();
      }, 200);
    });
  });

  describe('setQueryString', () => {
    it('should pass through `userTyping` to the state', done => {
      expect(QueryStore.state.userTyping).to.be.false;
      unsubscribe = QueryStore.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });
      QueryStore.setQueryString('filter', '{foo: 1}', true);
    });
    context('when setting a valid input', () => {
      describe('filter', () => {
        it('sets the filterString, filterValid and filter', done => {
          expect(QueryStore.state.filterString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.filterString).to.be.equal('{foo: 1}');
            expect(state.filterValid).to.be.true;
            expect(state.filter).to.deep.equal({ foo: 1 });
            done();
          });
          QueryStore.setQueryString('filter', '{foo: 1}');
        });
      });
      describe('project', () => {
        it('sets the projectString, projectValid and project', done => {
          expect(QueryStore.state.projectString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.projectString).to.be.equal('{foo: 1}');
            expect(state.projectValid).to.be.true;
            expect(state.project).to.deep.equal({ foo: 1 });
            done();
          });
          QueryStore.setQueryString('project', '{foo: 1}');
        });
      });
      describe('sort', () => {
        it('sets the sortString, sortValid and sort', done => {
          expect(QueryStore.state.sortString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.sortString).to.be.equal('{foo: 1}');
            expect(state.sortValid).to.be.true;
            expect(state.sort).to.deep.equal({ foo: 1 });
            done();
          });
          QueryStore.setQueryString('sort', '{foo: 1}');
        });
      });
      describe('skip', () => {
        it('sets the skipString, skipValid and skip', done => {
          expect(QueryStore.state.skipString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.skipString).to.be.equal('20');
            expect(state.skipValid).to.be.true;
            expect(state.skip).to.deep.equal(20);
            done();
          });
          QueryStore.setQueryString('skip', '20');
        });
      });
      describe('limit', () => {
        it('sets the limitString, limitValid and limit', done => {
          expect(QueryStore.state.limitString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.limitString).to.be.equal('100');
            expect(state.limitValid).to.be.true;
            expect(state.limit).to.deep.equal(100);
            done();
          });
          QueryStore.setQueryString('limit', '100');
        });
      });
    });

    context('when setting an invalid input', () => {
      describe('filter', () => {
        it('sets the filterString, filterValid but not filter', done => {
          expect(QueryStore.state.filterString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.filterString).to.be.equal('{filter: invalid}');
            expect(state.filterValid).to.be.false;
            expect(state.filter).to.deep.equal({});
            done();
          });
          QueryStore.setQueryString('filter', '{filter: invalid}');
        });
      });
      describe('project', () => {
        it('sets the projectString, projectValid but not project', done => {
          expect(QueryStore.state.projectString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.projectString).to.be.equal('{project: "invalid"}');
            expect(state.projectValid).to.be.false;
            expect(state.project).to.null;
            done();
          });
          QueryStore.setQueryString('project', '{project: "invalid"}');
        });
      });
      describe('sort', () => {
        it('sets the sortString, sortValid but not sort', done => {
          expect(QueryStore.state.sortString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.sortString).to.be.equal('{sort: null}');
            expect(state.sortValid).to.be.false;
            expect(state.sort).to.deep.equal(null);
            done();
          });
          QueryStore.setQueryString('sort', '{sort: null}');
        });
      });
      describe('skip', () => {
        it('sets the skipString, skipValid and skip', done => {
          expect(QueryStore.state.skipString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.skipString).to.be.equal('invalid input');
            expect(state.skipValid).to.be.false;
            expect(state.skip).to.deep.equal(0);
            done();
          });
          QueryStore.setQueryString('skip', 'invalid input');
        });
      });
      describe('limit', () => {
        it('sets the limitString, limitValid and limit', done => {
          expect(QueryStore.state.limitString).to.be.equal('');
          unsubscribe = QueryStore.listen(state => {
            expect(state.limitString).to.be.equal('invalid input');
            expect(state.limitValid).to.be.false;
            expect(state.limit).to.deep.equal(0);
            done();
          });
          QueryStore.setQueryString('limit', 'invalid input');
        });
      });
    });
  });
});
