import AppRegistry from 'hadron-app-registry';
import { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';

describe('ExportToLanguage Store', () => {
  describe('#onActivated', () => {
    const appRegistry = new AppRegistry();

    beforeEach(() => {
      activate(appRegistry);
      store.onActivated(appRegistry);
    });

    context('when aggregation opens export to language', () => {
      const aggregation = { cats: [ 'chashu', 'nori' ], birth_year: 2018 };

      beforeEach(() => {
        appRegistry.emit('open-aggregation-export-to-language', aggregation);
      });

      it('opens the aggregation modal', () => {
        expect(store.getState().exportQuery.modalOpen).to.equal(true);
      });

      it('sets namespace to Pipeline', () => {
        expect(store.getState().exportQuery.namespace).to.equal('Pipeline');
      });

      it('adds input query to the state', () => {
        expect(store.getState().exportQuery.inputQuery).to.equal(aggregation);
      });

      it('trigers run query command', () => {
        expect(store.getState().exportQuery.returnQuery).to.equal('{\n    \'cats\': [\n        \'chashu\', \'nori\'\n    ], \n    \'birth_year\': 2018\n}');
      });
    });

    context('when query opens export to language', () => {
      const query = { cats: [ 'chashu', 'nori' ], birth_year: 2018 };

      beforeEach(() => {
        appRegistry.emit('open-query-export-to-language', query);
      });

      it('opens the aggregation modal', () => {
        expect(store.getState().exportQuery.modalOpen).to.equal(true);
      });

      it('sets namespace to Pipeline', () => {
        expect(store.getState().exportQuery.namespace).to.equal('Query');
      });

      it('adds input query to the state', () => {
        expect(store.getState().exportQuery.inputQuery).to.equal(query);
      });

      it('trigers run query command', () => {
        expect(store.getState().exportQuery.returnQuery).to.equal('{\n    \'cats\': [\n        \'chashu\', \'nori\'\n    ], \n    \'birth_year\': 2018\n}');
      });
    });
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
        imports: ''
      }
    });
  });
});
