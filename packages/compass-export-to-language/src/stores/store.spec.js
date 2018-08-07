import AppRegistry from 'hadron-app-registry';
import { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import compiler from 'bson-transpilers';

const subscribeCheck = (pipeline, check, done) => {
  const unsubscribe = store.subscribe(() => {
    expect(store.getState().exportQuery.queryError).to.equal(null);
    if (check(store.getState())) {
      unsubscribe();
      done();
    }
  });
  return unsubscribe;
};

describe('ExportToLanguage Store', () => {
  const appRegistry = new AppRegistry();
  let unsubscribe;

  before(() => {
    activate(appRegistry);
    store.onActivated(appRegistry);
  });

  describe('#onActivated', () => {
    afterEach(() => {
      if (unsubscribe !== undefined) unsubscribe();
    });

    describe('initial store state', () => {
      expect(store.getState()).to.deep.equal({
        exportQuery: {
          namespace: 'Query',
          copySuccess: false,
          outputLang: 'python',
          queryError: null,
          modalOpen: false,
          returnQuery: '',
          inputQuery: '',
          imports: '',
          builders: true
        }
      });
    });

    describe('when aggregation opens export to language', () => {
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
      it('opens the aggregation modal', (done) => {
        unsubscribe = subscribeCheck(agg, (s) => (s.exportQuery.modalOpen), done);
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('sets namespace to Pipeline', (done) => {
        unsubscribe = subscribeCheck(agg, (s) => (
          s.exportQuery.namespace === 'Pipeline'
        ), done);
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('adds input query to the state', (done) => {
        unsubscribe = subscribeCheck(agg, (s) => (
          s.exportQuery.inputQuery === agg
        ), done);
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });

      it('triggers run query command', (done) => {
        unsubscribe = subscribeCheck(agg, (s) => (
          s.exportQuery.returnQuery === compiler.shell.python.compile(agg)
        ), done);
        appRegistry.emit('open-aggregation-export-to-language', agg);
      });
    });

    describe('when query opens export to language', () => {
      const query = `{
  isQuery: true, 0: true, 1: 1, 2: NumberLong(100), 3: 0.001, 4: 0x1243, 5: 0o123,
  7: "str", 8: RegExp('10'), '8a': /abc/, '8b': RegExp('abc', 'i'),
  9: [1,2], 10: {x: 1}, 11: null, 12: undefined,
  100: Code("1", {x: 1}), '100a': Code("!"), 101: ObjectId(),
  103: DBRef("c", ObjectId()), 104: 1, 105: NumberInt(1), 106: NumberLong(1),
  107: MinKey(), 108: MaxKey(), 110: Timestamp(1, 100),
  111: Symbol('1'), 112: NumberDecimal(1), 200: Date(), '201a': new Date(),
  '201b': ISODate(), '201c': new ISODate()
}`;
      it('opens the query modal', (done) => {
        unsubscribe = subscribeCheck(query, (s) => (s.exportQuery.modalOpen), done);
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('sets namespace to Query', (done) => {
        unsubscribe = subscribeCheck(query, (s) => (
          s.exportQuery.namespace === 'Query'
        ), done);
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('adds input query to the state', (done) => {
        unsubscribe = subscribeCheck(query, (s) => (
          s.exportQuery.inputQuery === query
        ), done);
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('triggers run query command', (done) => {
        unsubscribe = subscribeCheck(query, (s) => (
          s.exportQuery.returnQuery === compiler.shell.python.compile(query)
        ), done);
        appRegistry.emit('open-query-export-to-language', query);
      });
    });
  });
});
