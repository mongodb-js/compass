import AppRegistry from 'hadron-app-registry';
import { expect } from 'chai';
import configureStore from './';

const subscribeCheck = (s, pipeline, check, done) => {
  const unsubscribe = s.subscribe(function () {
    try {
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

function inputExpressionEquals(actual, expected) {
  const expectedClean = { ...expected, exportMode: undefined };
  const actualClean = { ...actual, exportMode: undefined };

  return JSON.stringify(expectedClean) === JSON.stringify(actualClean);
}

describe('ExportToLanguage Store', function () {
  const localAppRegistry = new AppRegistry();
  const globalAppRegistry = new AppRegistry();
  let unsubscribe;
  let store;

  beforeEach(function () {
    store = configureStore({
      localAppRegistry: localAppRegistry,
      globalAppRegistry: globalAppRegistry,
      namespace: 'db.coll',
      dataProvider: {
        dataProvider: {
          getConnectionString() {
            return {
              clone() {
                return new URL('mongodb://localhost/');
              },
            };
          },
        },
      },
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
        localAppRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('adds input expression to the state', function (done) {
        unsubscribe = subscribeCheck(
          store,
          agg,
          (s) => s.inputExpression.aggregation === agg,
          done
        );
        localAppRegistry.emit('open-aggregation-export-to-language', agg);
      });
    });

    describe('when query opens export to language with imperfect fields', function () {
      it('filters query correctly with only filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            inputExpressionEquals(s.inputExpression, {
              filter: "'filterString'",
            }),
          done
        );
        localAppRegistry.emit(
          'open-query-export-to-language',
          {
            project: '',
            maxTimeMS: '',
            sort: '',
            skip: '',
            limit: '',
            collation: '',
            filter: "'filterString'",
          },
          'Query'
        );
      });

      it('filters query correctly with other args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            inputExpressionEquals(s.inputExpression, {
              filter: "'filterString'",
              skip: '10',
              limit: '50',
            }),
          done
        );
        localAppRegistry.emit(
          'open-query-export-to-language',
          {
            filter: "'filterString'",
            project: '',
            sort: '',
            collation: '',
            skip: '10',
            limit: '50',
            maxTimeMS: '',
          },
          'Query'
        );
      });

      it('handles default filter', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) => inputExpressionEquals(s.inputExpression, { filter: '{}' }),
          done
        );
        localAppRegistry.emit(
          'open-query-export-to-language',
          {
            project: '',
            maxTimeMS: '',
            sort: '',
            skip: '',
            limit: '',
            collation: '',
            filter: '',
          },
          'Query'
        );
      });

      it('handles null or missing args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) => inputExpressionEquals(s.inputExpression, { filter: '{}' }),
          done
        );
        localAppRegistry.emit(
          'open-query-export-to-language',
          {
            maxTimeMS: null,
            sort: null,
          },
          'Query'
        );
      });

      it('handles default filter with other args', function (done) {
        unsubscribe = subscribeCheck(
          store,
          {},
          (s) =>
            inputExpressionEquals(s.inputExpression, {
              filter: '{}',
              sort: '{x: 1}',
            }),
          done
        );
        localAppRegistry.emit(
          'open-query-export-to-language',
          {
            filter: '',
            project: '',
            sort: '{x: 1}',
            collation: '',
            skip: '',
            limit: '',
            maxTimeMS: '',
          },
          'Query'
        );
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
        localAppRegistry.emit('open-query-export-to-language', query, 'Query');
      });

      it('opens the query modal when called with a mode', function (done) {
        unsubscribe = subscribeCheck(store, query, (s) => s.modalOpen, done);
        localAppRegistry.emit('open-query-export-to-language', query, 'Query');
      });

      it('fails when a mode is not provided', function () {
        expect(() =>
          localAppRegistry.emit('open-query-export-to-language', query)
        ).to.throw();
      });

      it('adds input expression to the state', function (done) {
        unsubscribe = subscribeCheck(
          store,
          query,
          (s) => inputExpressionEquals(s.inputExpression, query),
          done
        );
        localAppRegistry.emit('open-query-export-to-language', query, 'Query');
      });
    });
  });
});
