import preferences from 'compass-preferences-model';
import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import compiler from 'bson-transpilers';
import configureStore from './';
import { uriChanged } from '../modules/uri';
import { driverChanged } from '../modules/driver';
import sinon from 'sinon';

const subscribeCheck = (s, pipeline, check, done) => {
  const unsubscribe = s.subscribe(function () {
    try {
      expect(s.getState().error).to.equal(null);
      if (check(s.getState())) {
        unsubscribe();
        done();
      }
    } catch (e) {
      done(e);
    }
  });
  return unsubscribe;
};

describe('ExportToLanguage Store', function () {
  const appRegistry = new AppRegistry();
  let unsubscribe;
  let store;

  beforeEach(function () {
    store = configureStore({
      localAppRegistry: appRegistry,
      namespace: 'db.coll',
      connectionString: 'mongodb://localhost/',
    });
  });
  afterEach(function () {
    if (unsubscribe !== undefined) unsubscribe();
  });

  describe('#onActivated', function () {
    describe('state passed from configure store', function () {
      it('namespace', function () {
        expect(store.getState().namespace).to.equal('db.coll');
      });
      it('URI', function () {
        expect(store.getState().uri).to.equal('mongodb://localhost/');
      });
    });

    describe('when aggregation opens export to language', function () {
      const agg = `{
  0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
  7: "str", 8: RegExp('10'), '8a': /abc/, '8b': RegExp('abc', 'i'),
  9: [1,2], 10: {x: 1}, 11: null, 12: undefined,
  100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
  103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
  107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
  111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
  '201b': ISODate(), '201c': new ISODate()
}`;
      it('opens the aggregation modal', function (done) {
        unsubscribe = subscribeCheck(store, agg, (s) => s.modalOpen, done);
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('sets mode to Pipeline', function (done) {
        unsubscribe = subscribeCheck(
          store,
          agg,
          (s) => s.mode === 'Pipeline',
          done
        );
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('adds input expression to the state', function (done) {
        unsubscribe = subscribeCheck(
          store,
          agg,
          (s) => s.inputExpression.aggregation === agg,
          done
        );
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('triggers run transpiler command', function (done) {
        unsubscribe = subscribeCheck(
          store,
          agg,
          (s) => s.transpiledExpression === compiler.shell.python.compile(agg),
          done
        );
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      for (const protectConnectionStrings of [false, true]) {
        context(
          `when protect connection strings is ${protectConnectionStrings}`,
          function () {
            let sandbox;
            beforeEach(function () {
              sandbox = sinon.createSandbox();
              sandbox
                .stub(preferences, 'getPreferences')
                .returns({ protectConnectionStrings });
            });
            afterEach(function () {
              return sandbox.restore();
            });

            it('showes/hides the connection string as appropriate', function (done) {
              unsubscribe = subscribeCheck(
                store,
                agg,
                (s) =>
                  s.transpiledExpression.includes('foo:bar') ===
                  !protectConnectionStrings,
                done
              );
              store.dispatch(uriChanged('mongodb://foo:bar@mongodb.net'));
              store.dispatch(driverChanged(true));
              appRegistry.emit('open-aggregation-export-to-language', agg);
            });
          }
        );
      }
    });

    describe('when query opens export to language with imperfect fields', function () {
      it('filters query correctly with only filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({ filter: "'filterString'" }),
          done
        );
        appRegistry.emit('open-query-export-to-language', {
          project: '',
          maxTimeMS: '',
          sort: '',
          skip: '',
          limit: '',
          collation: '',
          filter: "'filterString'",
        });
      });

      it('filters query correctly with other args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({
              filter: "'filterString'",
              skip: '10',
              limit: '50',
            }),
          done
        );
        appRegistry.emit('open-query-export-to-language', {
          filter: "'filterString'",
          project: '',
          sort: '',
          collation: '',
          skip: '10',
          limit: '50',
          maxTimeMS: '',
        });
      });

      it('handles default filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({ filter: '{}' }),
          done
        );
        appRegistry.emit('open-query-export-to-language', {
          project: '',
          maxTimeMS: '',
          sort: '',
          skip: '',
          limit: '',
          collation: '',
          filter: '',
        });
      });

      it('handles null or missing args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({ filter: '{}' }),
          done
        );
        appRegistry.emit('open-query-export-to-language', {
          maxTimeMS: null,
          sort: null,
        });
      });

      it('treats a string as a filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({ filter: '{x: 1, y: 2}' }),
          done
        );
        appRegistry.emit('open-query-export-to-language', '{x: 1, y: 2}');
      });

      it('treats a empty string as a default filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({ filter: '{}' }),
          done
        );
        appRegistry.emit('open-query-export-to-language', '');
      });

      it('handles default filter with other args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            JSON.stringify(s.inputExpression) ===
            JSON.stringify({
              filter: '{}',
              sort: '{x: 1}',
            }),
          done
        );
        appRegistry.emit('open-query-export-to-language', {
          filter: '',
          project: '',
          sort: '{x: 1}',
          collation: '',
          skip: '',
          limit: '',
          maxTimeMS: '',
        });
      });
    });

    describe('when query opens export to language', function () {
      const query = {
        filter: `{
  isQuery: true, 0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
  7: "str", 8: RegExp('10'), '8a': /abc/, '8b': RegExp('abc', 'i'),
  9: [1,2], 10: {x: 1}, 11: null, 12: undefined,
  100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
  103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
  107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
  111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
  '201b': ISODate(), '201c': new ISODate()
}`,
      };
      it('opens the query modal', function (done) {
        unsubscribe = subscribeCheck(store, query, (s) => s.modalOpen, done);
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('sets mode to Query', function (done) {
        unsubscribe = subscribeCheck(
          store,
          query,
          (s) => s.mode === 'Query',
          done
        );
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('adds input expression to the state', function (done) {
        unsubscribe = subscribeCheck(
          store,
          query,
          (s) => JSON.stringify(s.inputExpression) === JSON.stringify(query),
          done
        );
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('triggers run transpiler command', function (done) {
        unsubscribe = subscribeCheck(
          store,
          query,
          (s) =>
            s.transpiledExpression ===
            compiler.shell.python.compile(query.filter),
          done
        );
        appRegistry.emit('open-query-export-to-language', query);
      });
    });
  });
});
