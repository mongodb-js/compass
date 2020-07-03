/**
 * store tests have to be run as an electron renderer test due to depending on mongodb-query-parser which
 * requires an iframe context in order to correctly parse the query provided. The tests will fail when attempting
 * to run as just a unit test.
 **/

/* eslint-disable no-unused-expressions */

import configureStore from 'stores';
import configureActions from 'actions';

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
  let actions;
  let store;
  let unsubscribe;

  beforeEach(function() {
    actions = configureActions();
    store = configureStore({
      actions: actions
    });
  });

  it('should have the correct initial state', function() {
    expect(store.state).to.be.deep.equal({
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
      maxTimeMSString: '',
      queryState: DEFAULT_STATE,
      valid: true,
      filterValid: true,
      projectValid: true,
      collationValid: true,
      sortValid: true,
      skipValid: true,
      limitValid: true,
      sampleValid: true,
      maxTimeMSValid: true,
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
  });

  describe('toggleQueryOptions', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('sets expanded to true when calling it once', function(done) {
      expect(store.state.expanded).to.equal(false);

      unsubscribe = store.listen(state => {
        expect(state.expanded).to.equal(true);
        done();
      });

      store.toggleQueryOptions();
    });

    it('sets expanded back to false when calling it twice', function(done) {
      expect(store.state.expanded).to.equal(false);

      store.toggleQueryOptions();

      unsubscribe = store.listen(state => {
        expect(state.expanded).to.equal(false);
        done();
      });

      store.toggleQueryOptions();
    });
  });

  describe('valid', function() {
    afterEach(function() {
      unsubscribe();
    });

    describe('when using setQuery', function() {
      it('updates its valid state for an invalid query', function(done) {
        expect(store.state.valid).to.equal(true);

        unsubscribe = store.listen(state => {
          expect(state.valid).to.equal(false);
          done();
        });

        store.setQuery({ skip: 'invalid' });
      });

      it('updates its valid state for a valid query', function(done) {
        store.setQuery({ skip: 'invalid' });

        unsubscribe = store.listen(state => {
          expect(state.valid).to.equal(true);
          done();
        });

        store.setQuery({ skip: 3 });
      });
    });

    describe('when using setQueryString', function() {
      it('updates its valid state for an invalid query', function(done) {
        expect(store.state.valid).to.equal(true);

        unsubscribe = store.listen(state => {
          expect(state.valid).to.equal(false);
          done();
        });

        store.setQueryString('skip', 'invalid');
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
        sample: false,
        maxTimeMS: 5000
      };

      unsubscribe = store.listen(function() {
        const cloned = store._cloneQuery();

        // different object
        expect(cloned).to.not.be.equal(query);

        // same content
        expect(cloned).to.be.deep.equal(query);

        done();
      });

      store.setQuery(query);
    });
  });

  describe('setQuery', function() {
    afterEach(function() {
      unsubscribe();
    });

    describe('when setting a single query property', function() {
      it('sets a new `filter`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.filter).to.be.deep.equal({ foo: 1 });
          expect(state.filterString).to.be.equal('{foo: 1}');
          expect(state.filterValid).to.be.true;
          done();
        });

        store.setQuery({ filter: { foo: 1 } });
      });

      it('sets a new `project`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.project).to.be.deep.equal({ _id: 0 });
          expect(state.projectString).to.be.equal('{_id: 0}');
          expect(state.projectValid).to.be.true;
          done();
        });

        store.setQuery({ project: { _id: 0 } });
      });

      it('sets a new `collation`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.collation).to.be.deep.equal({ locale: 'simple' });
          expect(state.collationString).to.be.equal("{locale: 'simple'}");
          expect(state.collationValid).to.be.true;
          done();
        });

        store.setQuery({ collation: { locale: 'simple' } });
      });

      it('sets a new `sort`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.sort).to.be.deep.equal({ foo: -1 });
          expect(state.sortString).to.be.equal('{foo: -1}');
          expect(state.sortValid).to.be.true;
          done();
        });

        store.setQuery({ sort: { foo: -1 } });
      });

      it('sets a new `skip`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.skip).to.be.deep.equal(101);
          expect(state.skipString).to.be.equal('101');
          expect(state.skipValid).to.be.true;
          done();
        });

        store.setQuery({ skip: 101 });
      });

      it('sets a new `limit`', function(done) {
        unsubscribe = store.listen(state => {
          expect(state.limit).to.be.deep.equal(3);
          expect(state.limitString).to.be.equal('3');
          expect(state.limitValid).to.be.true;
          done();
        });

        store.setQuery({ limit: 3 });
      });

      it('sets a new `sample` to true', (done) => {
        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.sampleValid).to.be.true;
          done();
        });

        store.setQuery({sample: true});
      });

      it('sets a new `sample` to false', (done) => {
        store.setQuery({sample: true});

        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.false;
          expect(state.sampleValid).to.be.true;
          done();
        });

        store.setQuery({sample: false});
      });
    });

    describe('when setting multiple query properties', function() {
      it('sets all state fields correctly', function(done) {
        unsubscribe = store.listen(state => {
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

        store.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });
      });
    });

    describe('when using toggleSample', function() {
      it('toggles the sample boolean value if no arguments are passed', (done) => {
        store.state.sample = false;

        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });

        store.toggleSample();
      });

      it('sets the sample to true if true is passed in', (done) => {
        store.state.sample = true;

        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.true;
          done();
        });

        store.toggleSample(true);
      });

      it('sets the sample to false if false is passed in', (done) => {
        store.state.sample = true;

        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.false;
          done();
        });
        store.toggleSample(false);
      });

      it('sets the limit to 1000 if sample is true and limit is 0', (done) => {
        store.state.sample = false;
        store.state.limit = 0;

        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(1000);
          expect(state.limitString).to.be.equal('1000');
          expect(state.limitValid).to.be.true;
          done();
        });

        store.toggleSample(true);
      });

      it('leaves the limit as is if sample is true and limit is not 0', (done) => {
        store.state.sample = false;
        store.state.limit = 123;
        unsubscribe = store.listen((state) => {
          expect(state.sample).to.be.true;
          expect(state.limit).to.be.equal(123);
          done();
        });

        store.toggleSample(true);
      });
    });

    describe('when passing no query object', function() {
      it('sets the default query values', function(done) {
        store.setQuery({
          limit: false,
          sort: { field: -1 },
          filter: { a: { $exists: true } }
        });

        expect(store._cloneQuery()).to.not.deep.equal(
          store._getDefaultQuery()
        );

        unsubscribe = store.listen(function() {
          expect(store._cloneQuery()).to.deep.equal(
            store._getDefaultQuery()
          );
          done();
        });

        store.setQuery();
      });
    });
  });

  describe('apply', function() {
    describe('with a valid query', function() {
      afterEach(function() {
        unsubscribe();
      });

      it('sets queryState to active and sets the lastExecuteQuery', function(done) {
        store.setQuery({ limit: 3, filter: { foo: 'bar' } });

        unsubscribe = store.listen(state => {
          expect(state.lastExecutedQuery.limit).to.be.equal(3);
          expect(state.lastExecutedQuery.filter).to.be.deep.equal({
            foo: 'bar'
          });
          expect(state.lastExecutedQuery.skip).to.be.equal(0);
          expect(state.queryState).to.be.equal('apply');
          expect(state.valid).to.be.true;
          done();
        });

        store.apply();
      });
    });
    describe('with an invalid query', function() {
      it('does not set lastExecuteQuery or queryState', function(done) {
        store.setQuery({ limit: 'invalid', filter: { foo: 'bar' } });
        store.apply();

        setTimeout(function() {
          expect(store.state.lastExecutedQuery).to.be.null;
          expect(store.state.queryState).to.be.equal('reset');
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
        unsubscribe = store.listen(function() {
          expect.fail(0, 1, 'Should not have triggered the store.');
        });

        setTimeout(function() {
          done();
        });

        store.reset();
      });
    });
    describe('when the current query is different to the default', function() {
      it('resets the query to the default', function(done) {
        store.setQuery({ limit: 4, filter: { foo: 'bar' } });

        unsubscribe = store.listen(function() {
          expect(store._cloneQuery()).to.be.deep.equal(
            store._getDefaultQuery()
          );
          done();
        });

        store.reset();
      });
    });
    describe('when the both query and lastExecutedQuery have been changed', function() {
      it('resets the query to the default', function(done) {
        store.setQuery({ limit: 4, filter: { foo: 'bar' } });
        store.apply();

        unsubscribe = store.listen(function() {
          expect(store._cloneQuery()).to.be.deep.equal(
            store._getDefaultQuery()
          );
          expect(store.state.lastExecutedQuery).to.be.deep.null;
          expect(store.state.queryState).to.be.equal('reset');
          done();
        });

        store.reset();
      });
    });
  });

  describe('typeQueryString', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('should pass through `userTyping` to the state', function(done) {
      expect(store.state.userTyping).to.be.false;

      unsubscribe = store.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });

      store.typeQueryString('filter', '{foo: 1}');
    });

    it('should set `userTyping` back to false after 100ms', function(done) {
      expect(store.state.userTyping).to.be.false;

      store.typeQueryString('filter', '{foo: 1}');

      setTimeout(function() {
        expect(store.state.userTyping).to.be.false;
        done();
      }, 200);
    });
  });

  describe('setQueryString', function() {
    afterEach(function() {
      unsubscribe();
    });

    it('should pass through `userTyping` to the state', function(done) {
      expect(store.state.userTyping).to.be.false;

      unsubscribe = store.listen(state => {
        expect(state.userTyping).to.be.true;
        done();
      });

      store.setQueryString('filter', '{foo: 1}', true);
    });

    describe('when setting a valid input', function() {
      describe('filter', function() {
        it('sets the filterString, filterValid and filter', function(done) {
          expect(store.state.filterString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.filterString).to.be.equal('{foo: 1}');
            expect(state.filterValid).to.be.true;
            expect(state.filter).to.deep.equal({ foo: 1 });
            done();
          });

          store.setQueryString('filter', '{foo: 1}');
        });
      });

      describe('project', function() {
        it('sets the projectString, projectValid and project', function(done) {
          expect(store.state.projectString).to.be.equal('');
          unsubscribe = store.listen(state => {
            expect(state.projectString).to.be.equal('{foo: 1}');
            expect(state.projectValid).to.be.true;
            expect(state.project).to.deep.equal({ foo: 1 });
            done();
          });
          store.setQueryString('project', '{foo: 1}');
        });
      });

      describe('collation', function() {
        it('sets the collationString, collationValid and collation', function(done) {
          expect(store.state.collationString).to.be.equal('');
          unsubscribe = store.listen(state => {
            expect(state.collationString).to.be.equal("{locale: 'simple'}");
            expect(state.collationValid).to.be.true;
            expect(state.collation).to.deep.equal({ locale: 'simple' });
            done();
          });
          store.setQueryString('collation', "{locale: 'simple'}");
        });
      });

      describe('sort', function() {
        it('sets the sortString, sortValid and sort', function(done) {
          expect(store.state.sortString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.sortString).to.be.equal('{foo: 1}');
            expect(state.sortValid).to.be.true;
            expect(state.sort).to.deep.equal({ foo: 1 });
            done();
          });

          store.setQueryString('sort', '{foo: 1}');
        });
      });

      describe('skip', function() {
        it('sets the skipString, skipValid and skip', function(done) {
          expect(store.state.skipString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.skipString).to.be.equal('20');
            expect(state.skipValid).to.be.true;
            expect(state.skip).to.deep.equal(20);
            done();
          });

          store.setQueryString('skip', '20');
        });
      });

      describe('limit', function() {
        it('sets the limitString, limitValid and limit', function(done) {
          expect(store.state.limitString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.limitString).to.be.equal('100');
            expect(state.limitValid).to.be.true;
            expect(state.limit).to.deep.equal(100);
            done();
          });

          store.setQueryString('limit', '100');
        });
      });
    });

    describe('when setting an invalid input', function() {
      describe('filter', function() {
        it('sets the filterString, filterValid but not filter', function(done) {
          expect(store.state.filterString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.filterString).to.be.equal('not valid');
            expect(state.filterValid).to.be.false;
            expect(state.filter).to.deep.equal({});
            done();
          });

          store.setQueryString('filter', 'not valid');
        });
      });

      describe('project', function() {
        it('sets the projectString, projectValid but not project', function(done) {
          expect(store.state.projectString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.projectString).to.be.equal('{project: "invalid"}');
            expect(state.projectValid).to.be.false;
            expect(state.project).to.null;
            done();
          });

          store.setQueryString('project', '{project: "invalid"}');
        });
      });

      describe('collation', function() {
        it('sets the collationString, collationValid but not collation', function(done) {
          expect(store.state.collationString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.collationString).to.be.equal('{locale: "invalid"}');
            expect(state.collationValid).to.be.false;
            expect(state.collation).to.null;
            done();
          });

          store.setQueryString('collation', '{locale: "invalid"}');
        });
      });

      describe('sort', function() {
        it('sets the sortString, sortValid but not sort', function(done) {
          expect(store.state.sortString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.sortString).to.be.equal('{sort: null}');
            expect(state.sortValid).to.be.false;
            expect(state.sort).to.deep.equal(null);
            done();
          });

          store.setQueryString('sort', '{sort: null}');
        });
      });

      describe('skip', function() {
        it('sets the skipString, skipValid and skip', function(done) {
          expect(store.state.skipString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.skipString).to.be.equal('invalid input');
            expect(state.skipValid).to.be.false;
            expect(state.skip).to.deep.equal(0);
            done();
          });

          store.setQueryString('skip', 'invalid input');
        });
      });

      describe('limit', function() {
        it('sets the limitString, limitValid and limit', function(done) {
          expect(store.state.limitString).to.be.equal('');

          unsubscribe = store.listen(state => {
            expect(state.limitString).to.be.equal('invalid input');
            expect(state.limitValid).to.be.false;
            expect(state.limit).to.deep.equal(0);
            done();
          });

          store.setQueryString('limit', 'invalid input');
        });
      });
    });
  });
});

/* eslint-enable no-unused-expressions */
