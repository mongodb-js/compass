import configureStore from '../../src/stores';
import AppRegistry from 'hadron-app-registry';
import { ANALYSIS_STATE_INITIAL } from '../../src/constants/analysis-states';

describe('Schema Store', () => {
  describe('#configureStore', () => {
    let store;
    const localAppRegistry = new AppRegistry();
    const globalAppRegistry = new AppRegistry();
    const dataService = 'test';
    const namespace = 'db.coll';

    beforeEach(() => {
      store = configureStore({
        localAppRegistry: localAppRegistry,
        globalAppRegistry: globalAppRegistry,
        dataProvider: {
          error: null,
          dataProvider: dataService
        },
        namespace: namespace
      });
    });

    afterEach(() => {
      store = null;
    });

    it('sets the local app registry', () => {
      expect(store.localAppRegistry).to.equal(localAppRegistry);
    });

    it('sets the global app registry', () => {
      expect(store.globalAppRegistry).to.equal(globalAppRegistry);
    });

    it('sets the data provider', () => {
      expect(store.dataService).to.equal(dataService);
    });

    it('sets the namespace', () => {
      expect(store.ns).to.equal(namespace);
    });

    it('defaults analysis state to initial', () => {
      expect(store.state.analysisState).to.equal(ANALYSIS_STATE_INITIAL);
    });

    it('defaults the error to empty', () => {
      expect(store.state.errorMessage).to.equal('');
    });

    it('defaults max time ms to the default', () => {
      expect(store.query.maxTimeMS).to.equal(60000);
    });

    it('defaults the schema to null', () => {
      expect(store.state.schema).to.equal(null);
    });
  });

  context('when query change events are emitted', () => {
    let store;
    const localAppRegistry = new AppRegistry();
    const filter = { name: 'test' };
    const limit = 50;
    const project = { name: 1 };

    beforeEach(() => {
      store = configureStore({ localAppRegistry: localAppRegistry });
      localAppRegistry.emit('query-changed', {
        filter: filter,
        limit: limit,
        project: project
      });
    });

    afterEach(() => {
      store = null;
    });

    it('sets the filter', () => {
      expect(store.query.filter).to.deep.equal(filter);
    });

    it('sets the limit', () => {
      expect(store.query.limit).to.deep.equal(limit);
    });

    it('sets the project', () => {
      expect(store.query.project).to.deep.equal(project);
    });
  });
});
