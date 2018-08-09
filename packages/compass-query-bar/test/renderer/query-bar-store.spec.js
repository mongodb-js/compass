/**
 * QueryBarStore tests have to be run as an electron renderer test due to depending on mongodb-query-parser which
 * requires an iframe context in order to correctly parse the query provided. The tests will fail when attempting
 * to run as just a unit test.
 **/

/* eslint-disable no-unused-expressions */

import assert from 'assert';
import { QueryBarStore } from 'stores';
import AppRegistry from 'hadron-app-registry';
import app from 'hadron-app';

import {
  DEFAULT_FILTER,
  DEFAULT_PROJECT,
  DEFAULT_COLLATION,
  DEFAULT_SORT,
  DEFAULT_SKIP,
  DEFAULT_LIMIT,
  DEFAULT_SAMPLE,
  DEFAULT_MAX_TIME_MS,
  DEFAULT_STATE
} from 'constants/query-bar-store';

describe('QueryBarStore [Store]', function() {
  global.hadronApp = app;
  const registry = new AppRegistry();
  const historyActions = {
    runQuery: {
      listen: () => {}
    }
  };
  let unsubscribe;

  before(function() {
    global.hadronApp.appRegistry = registry;
    registry.registerStore('QueryBarStore', QueryBarStore);
    registry.registerAction('QueryHistory.Actions', historyActions);
    registry.onActivated();
  });

  after(function() {
    global.hadronApp.appRegistry = null;
  });

  beforeEach(function() {
    QueryBarStore.setState( QueryBarStore.getInitialState() );
  });

  it('should have the correct initial state', function() {
    expect(QueryBarStore.state).to.be.deep.equal({
      filter: DEFAULT_FILTER,
      project: DEFAULT_PROJECT,
      collation: DEFAULT_COLLATION,
      sort: DEFAULT_SORT,
      skip: DEFAULT_SKIP,
      limit: DEFAULT_LIMIT,
      sample: DEFAULT_SAMPLE,
      maxTimeMS: DEFAULT_MAX_TIME_MS,
      filterString: '',
      projectString: '',
      collationString: '',
      sortString: '',
      skipString: '',
      limitString: '',
      queryState: DEFAULT_STATE,
      valid: true,
      filterValid: true,
      projectValid: true,
      collationValid: true,
      sortValid: true,
      skipValid: true,
      limitValid: true,
      sampleValid: true,
      serverVersion: '3.6.0',
      lastExecutedQuery: null,
      userTyping: false,
      autoPopulated: false,
      expanded: false,
      ns: '',
      schemaFields: []
    });
  });

  describe('AppRegistry events', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('it responds to the AppRegistry emitting a collection-changed event and updates the namespace', function(done) {
      unsubscribe = QueryBarStore.listen((state) => {
        expect(state.ns).to.equal('db.test');
        done();
      });

      registry.emit('collection-changed', 'db.test');
    });

    it('it responds to the AppRegistry emitting a database-changed event and updates the namespace', function(done) {
      unsubscribe = QueryBarStore.listen((state) => {
        expect(state.ns).to.equal('db.test');
        done();
      });

      registry.emit('database-changed', 'db.test');
    });
  });

  describe('toggleQueryOptions', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('sets expanded to true when calling it once', function(done) {
      expect(QueryBarStore.state.expanded).to.equal(false);

      unsubscribe = QueryBarStore.listen(state => {
        expect(state.expanded).to.equal(true);
        done();
      });

      QueryBarStore.toggleQueryOptions();
    });

    it('sets expanded back to false when calling it twice', function(done) {
      expect(QueryBarStore.state.expanded).to.equal(false);

      QueryBarStore.toggleQueryOptions();

      unsubscribe = QueryBarStore.listen(state => {
        expect(state.expanded).to.equal(false);
        done();
      });

      QueryBarStore.toggleQueryOptions();
    });
  });

  describe('valid', function() {
    afterEach(function() {
      unsubscribe();
    });

    describe('when using setQuery', function() {
      it('updates its valid state for an invalid query', function(done) {
        expect(QueryBarStore.state.valid).to.equal(true);

        unsubscribe = QueryBarStore.listen(state => {
          expect(state.valid).to.equal(false);
          done();
        });

        QueryBarStore.setQuery({ skip: 'invalid' });
      });

      it('updates its valid state for a valid query', function(done) {
        QueryBarStore.setQuery({ skip: 'invalid' });

        unsubscribe = QueryBarStore.listen(state => {
          expect(state.valid).to.equal(true);
          done();
        });

        QueryBarStore.setQuery({ skip: 3 });
      });
    });

    describe('when using setQueryString', function() {
      it('updates its valid state for an invalid query', function(done) {
        expect(QueryBarStore.state.valid).to.equal(true);

        unsubscribe = QueryBarStore.listen(state => {
          expect(state.valid).to.equal(false);
          done();
        });

        QueryBarStore.setQueryString('skip', 'invalid');
      });
    });
  });

  describe('_cloneQuery', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('returns a clone of the current query', function(done) {
      const query = {
        filter: { a: { $exists: true } },
        project: { b: 1 },
        sort: { c: -1, d: 1 },
        collation: { locale: 'simple' },
        skip: 5,
        limit: 10,
        sample: false
      };

      unsubscribe = QueryBarStore.listen(function() {
        const cloned = QueryBarStore._cloneQuery();

        // different object
        expect(cloned).to.not.be.equal(query);

        // same content
        expect(cloned).to.be.deep.equal(query);

        done();
      });

      QueryBarStore.setQuery(query);
    });
  });

  describe('setQuery', function() {
    afterEach(function() {
      unsubscribe();
    });

    describe('when setting a single query property', function() {
      it('sets a new `filter`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.filter).to.be.deep.equal({ foo: 1 });
          expect(state.filterString).to.be.equal('{foo: 1}');
          expect(state.filterValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ filter: { foo: 1 } });
      });

      it('sets a new `project`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.project).to.be.deep.equal({ _id: 0 });
          expect(state.projectString).to.be.equal('{_id: 0}');
          expect(state.projectValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ project: { _id: 0 } });
      });

      it('sets a new `collation`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.collation).to.be.deep.equal({ locale: 'simple' });
          expect(state.collationString).to.be.equal("{locale: 'simple'}");
          expect(state.collationValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ collation: { locale: 'simple' } });
      });

      it('sets a new `sort`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.sort).to.be.deep.equal({ foo: -1 });
          expect(state.sortString).to.be.equal('{foo: -1}');
          expect(state.sortValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ sort: { foo: -1 } });
      });

      it('sets a new `skip`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.skip).to.be.deep.equal(101);
          expect(state.skipString).to.be.equal('101');
          expect(state.skipValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ skip: 101 });
      });

      it('sets a new `limit`', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
          expect(state.limit).to.be.deep.equal(3);
          expect(state.limitString).to.be.equal('3');
          expect(state.limitValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({ limit: 3 });
      });

      it('sets a new `sample` to true', (done) => {
        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.sampleValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({sample: true});
      });

      it('sets a new `sample` to false', (done) => {
        QueryBarStore.setQuery({sample: true});

        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.false;
          expect(state.sampleValid).to.be.true;
          done();
        });

        QueryBarStore.setQuery({sample: false});
      });
    });

    describe('when setting multiple query properties', function() {
      it('sets all state fields correctly', function(done) {
        unsubscribe = QueryBarStore.listen(state => {
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

        QueryBarStore.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });
      });
    });

    describe('when using toggleSample', function() {
      it('toggles the sample boolean value if no arguments are passed', (done) => {
        QueryBarStore.state.sample = false;

        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });

        QueryBarStore.toggleSample();
      });

      it('sets the sample to true if true is passed in', (done) => {
        QueryBarStore.state.sample = true;

        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });

        QueryBarStore.toggleSample(true);
      });

      it('sets the sample to false if false is passed in', (done) => {
        QueryBarStore.state.sample = true;

        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.false;
          done();
        });
        QueryBarStore.toggleSample(false);
      });

      it('sets the limit to 1000 if sample is true and limit is 0', (done) => {
        QueryBarStore.state.sample = false;
        QueryBarStore.state.limit = 0;

        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(1000);
          expect(state.limitString).to.be.equal('1000');
          expect(state.limitValid).to.be.true;
          done();
        });

        QueryBarStore.toggleSample(true);
      });

      it('leaves the limit as is if sample is true and limit is not 0', (done) => {
        QueryBarStore.state.sample = false;
        QueryBarStore.state.limit = 123;
        unsubscribe = QueryBarStore.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(123);
          done();
        });

        QueryBarStore.toggleSample(true);
      });
    });

    describe('when passing no query object', function() {
      it('sets the default query values', function(done) {
        QueryBarStore.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });

        expect(QueryBarStore._cloneQuery()).to.not.deep.equal(
          QueryBarStore._getDefaultQuery()
        );

        unsubscribe = QueryBarStore.listen(function() {
          expect(QueryBarStore._cloneQuery()).to.deep.equal(
            QueryBarStore._getDefaultQuery()
          );
          done();
        });

        QueryBarStore.setQuery();
      });
    });
  });

  describe('apply', function() {
    describe('with a valid query', function() {
      afterEach(function() {
        unsubscribe();
      });

      it('sets queryState to active and sets the lastExecuteQuery', function(done) {
        QueryBarStore.setQuery({ limit: 3, filter: { foo: 'bar' } });

        unsubscribe = QueryBarStore.listen(state => {
          expect(state.lastExecutedQuery.limit).to.be.equal(3);
          expect(state.lastExecutedQuery.filter).to.be.deep.equal({
            foo: 'bar'
          });
          expect(state.lastExecutedQuery.skip).to.be.equal(0);
          expect(state.queryState).to.be.equal('apply');
          expect(state.valid).to.be.true;
          done();
        });

        QueryBarStore.apply();
      });
    });
    describe('with an invalid query', function() {
      it('does not set lastExecuteQuery or queryState', function(done) {
        QueryBarStore.setQuery({ limit: 'invalid', filter: { foo: 'bar' } });
        QueryBarStore.apply();

        setTimeout(function() {
          expect(QueryBarStore.state.lastExecutedQuery).to.be.null;
          expect(QueryBarStore.state.queryState).to.be.equal('reset');
          done();
        }, 10);
      });
    });
  });

  describe('reset', function() {
    afterEach(function() {
      unsubscribe();
    });

    describe('when the current query is the default query', function() {
      it('does not trigger the store', function(done) {
        unsubscribe = QueryBarStore.listen(function() {
          assert.fail(0, 1, 'Should not have triggered the store.');
        });

        setTimeout(function() {
          done();
        });

        QueryBarStore.reset();
      });
    });
    describe('when the current query is different to the default', function() {
      it('resets the query to the default', function(done) {
        QueryBarStore.setQuery({ limit: 4, filter: { foo: 'bar' } });

        unsubscribe = QueryBarStore.listen(function() {
          expect(QueryBarStore._cloneQuery()).to.be.deep.equal(
            QueryBarStore._getDefaultQuery()
          );
          done();
        });

        QueryBarStore.reset();
      });
    });
    describe('when the both query and lastExecutedQuery have been changed', function() {
      it('resets the query to the default', function(done) {
        QueryBarStore.setQuery({ limit: 4, filter: { foo: 'bar' } });
        QueryBarStore.apply();

        unsubscribe = QueryBarStore.listen(function() {
          expect(QueryBarStore._cloneQuery()).to.be.deep.equal(
            QueryBarStore._getDefaultQuery()
          );
          expect(QueryBarStore.state.lastExecutedQuery).to.be.deep.null;
          expect(QueryBarStore.state.queryState).to.be.equal('reset');
          done();
        });

        QueryBarStore.reset();
      });
    });
  });

  describe('typeQueryString', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('should pass through `userTyping` to the state', function(done) {
      expect(QueryBarStore.state.userTyping).to.be.false;

      unsubscribe = QueryBarStore.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });

      QueryBarStore.typeQueryString('filter', '{foo: 1}');
    });

    it('should set `userTyping` back to false after 100ms', function(done) {
      expect(QueryBarStore.state.userTyping).to.be.false;

      QueryBarStore.typeQueryString('filter', '{foo: 1}');

      setTimeout(function() {
        expect(QueryBarStore.state.userTyping).to.be.false;
        done();
      }, 200);
    });
  });

  describe('setQueryString', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('should pass through `userTyping` to the state', function(done) {
      expect(QueryBarStore.state.userTyping).to.be.false;

      unsubscribe = QueryBarStore.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });

      QueryBarStore.setQueryString('filter', '{foo: 1}', true);
    });

    describe('when setting a valid input', function() {
      describe('filter', function() {
        it('sets the filterString, filterValid and filter', function(done) {
          expect(QueryBarStore.state.filterString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.filterString).to.be.equal('{foo: 1}');
            expect(state.filterValid).to.be.true;
            expect(state.filter).to.deep.equal({ foo: 1 });
            done();
          });

          QueryBarStore.setQueryString('filter', '{foo: 1}');
        });
      });

      describe('project', function() {
        it('sets the projectString, projectValid and project', function(done) {
          expect(QueryBarStore.state.projectString).to.be.equal('');
          unsubscribe = QueryBarStore.listen(state => {
            expect(state.projectString).to.be.equal('{foo: 1}');
            expect(state.projectValid).to.be.true;
            expect(state.project).to.deep.equal({ foo: 1 });
            done();
          });
          QueryBarStore.setQueryString('project', '{foo: 1}');
        });
      });

      describe('collation', function() {
        it('sets the collationString, collationValid and collation', function(done) {
          expect(QueryBarStore.state.collationString).to.be.equal('');
          unsubscribe = QueryBarStore.listen(state => {
            expect(state.collationString).to.be.equal("{locale: 'simple'}");
            expect(state.collationValid).to.be.true;
            expect(state.collation).to.deep.equal({ locale: 'simple' });
            done();
          });
          QueryBarStore.setQueryString('collation', "{locale: 'simple'}");
        });
      });

      describe('sort', function() {
        it('sets the sortString, sortValid and sort', function(done) {
          expect(QueryBarStore.state.sortString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.sortString).to.be.equal('{foo: 1}');
            expect(state.sortValid).to.be.true;
            expect(state.sort).to.deep.equal({ foo: 1 });
            done();
          });

          QueryBarStore.setQueryString('sort', '{foo: 1}');
        });
      });

      describe('skip', function() {
        it('sets the skipString, skipValid and skip', function(done) {
          expect(QueryBarStore.state.skipString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.skipString).to.be.equal('20');
            expect(state.skipValid).to.be.true;
            expect(state.skip).to.deep.equal(20);
            done();
          });

          QueryBarStore.setQueryString('skip', '20');
        });
      });

      describe('limit', function() {
        it('sets the limitString, limitValid and limit', function(done) {
          expect(QueryBarStore.state.limitString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.limitString).to.be.equal('100');
            expect(state.limitValid).to.be.true;
            expect(state.limit).to.deep.equal(100);
            done();
          });

          QueryBarStore.setQueryString('limit', '100');
        });
      });
    });

    describe('when setting an invalid input', function() {
      describe('filter', function() {
        it('sets the filterString, filterValid but not filter', function(done) {
          expect(QueryBarStore.state.filterString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.filterString).to.be.equal('{filter: invalid}');
            expect(state.filterValid).to.be.false;
            expect(state.filter).to.deep.equal({});
            done();
          });

          QueryBarStore.setQueryString('filter', '{filter: invalid}');
        });
      });

      describe('project', function() {
        it('sets the projectString, projectValid but not project', function(done) {
          expect(QueryBarStore.state.projectString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.projectString).to.be.equal('{project: "invalid"}');
            expect(state.projectValid).to.be.false;
            expect(state.project).to.null;
            done();
          });

          QueryBarStore.setQueryString('project', '{project: "invalid"}');
        });
      });

      describe('collation', function() {
        it('sets the collationString, collationValid but not collation', function(done) {
          expect(QueryBarStore.state.collationString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.collationString).to.be.equal('{locale: "invalid"}');
            expect(state.collationValid).to.be.false;
            expect(state.collation).to.null;
            done();
          });

          QueryBarStore.setQueryString('collation', '{locale: "invalid"}');
        });
      });

      describe('sort', function() {
        it('sets the sortString, sortValid but not sort', function(done) {
          expect(QueryBarStore.state.sortString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.sortString).to.be.equal('{sort: null}');
            expect(state.sortValid).to.be.false;
            expect(state.sort).to.deep.equal(null);
            done();
          });

          QueryBarStore.setQueryString('sort', '{sort: null}');
        });
      });

      describe('skip', function() {
        it('sets the skipString, skipValid and skip', function(done) {
          expect(QueryBarStore.state.skipString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.skipString).to.be.equal('invalid input');
            expect(state.skipValid).to.be.false;
            expect(state.skip).to.deep.equal(0);
            done();
          });

          QueryBarStore.setQueryString('skip', 'invalid input');
        });
      });

      describe('limit', function() {
        it('sets the limitString, limitValid and limit', function(done) {
          expect(QueryBarStore.state.limitString).to.be.equal('');

          unsubscribe = QueryBarStore.listen(state => {
            expect(state.limitString).to.be.equal('invalid input');
            expect(state.limitValid).to.be.false;
            expect(state.limit).to.deep.equal(0);
            done();
          });

          QueryBarStore.setQueryString('limit', 'invalid input');
        });
      });
    });
  });
});

/* eslint-enable no-unused-expressions */
