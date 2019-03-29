import AppRegistry from 'hadron-app-registry';
import { activate } from '@mongodb-js/compass-field-store';
import store from 'stores';
import { reset, INITIAL_STATE } from '../modules/index';
import hadronApp from 'hadron-app';
import {
  switchToTreeView,
  switchToJSONView,
  explainStateChanged,
  explainPlanFetched
} from 'modules/explain';
import { treeStagesChanged } from 'modules/tree-stages';

describe('Explain Plan Store', () => {
  const appRegistry = new AppRegistry();
  const collectionStore = { isReadonly: () => false };

  before(() => {
    global.hadronApp = hadronApp;
    global.hadronApp.appRegistry = appRegistry;
    global.hadronApp.appRegistry.registerStore('App.CollectionStore', collectionStore);
  });

  beforeEach(() => store.dispatch(reset()));

  describe('#onActivated', () => {
    beforeEach(() => {
      activate(appRegistry);
      store.onActivated(appRegistry);
    });

    context('when indexes are connected', () => {
      beforeEach(() => {
        appRegistry.emit('indexes-changed', [{ fields: {} }]);
      });

      it('sets the data service in the state', () => {
        expect(store.getState().indexes).to.deep.equal([{ fields: {} }]);
      });
    });

    context('when the collection is changed', () => {
      context('when there is no collection', () => {
        beforeEach(() => {
          store.onActivated(appRegistry);
          appRegistry.emit('collection-changed', 'db');
        });

        it('does not update the namespace in the store', () => {
          expect(store.getState().namespace).to.equal('');
        });

        it('resets the rest of the state to initial state', () => {
          expect(store.getState()).to.deep.equal({
            namespace: '',
            appRegistry: appRegistry,
            dataService: INITIAL_STATE.dataService,
            serverVersion: INITIAL_STATE.serverVersion,
            isEditable: INITIAL_STATE.isEditable,
            explain: INITIAL_STATE.explain,
            indexes: INITIAL_STATE.indexes,
            query: INITIAL_STATE.query,
            treeStages: INITIAL_STATE.treeStages
          });
        });
      });

      context('when there is a collection', () => {
        beforeEach(() => {
          store.onActivated(appRegistry);
          appRegistry.emit('collection-changed', 'db.coll');
        });

        it('updates the namespace in the store', () => {
          expect(store.getState().namespace.ns).to.equal('db.coll');
        });
      });
    });

    context('when the data service is connected', () => {
      beforeEach(() => {
        appRegistry.emit('data-service-connected', 'error', 'ds');
      });

      it('sets the data service in the state', () => {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', () => {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });

    context('when the server version is changed', () => {
      beforeEach(() => {
        appRegistry.emit('server-version-changed', '4.0.0');
      });

      it('sets the server version in the state', () => {
        expect(store.getState().serverVersion).to.equal('4.0.0');
      });
    });

    context('when the query is changed', () => {
      const query = {
        filter: {},
        sort: null,
        project: null,
        skip: 0,
        limit: 0,
        collation: null
      };

      beforeEach(() => {
        appRegistry.emit('query-changed', query);
      });

      it('sets the server version in the state', () => {
        expect(store.getState().query).to.equal(query);
      });
    });
  });

  describe('#dispatch', () => {
    context('when the action is unknown', () => {
      it('returns the initial state', (done) => {
        const unsubscribe = store.subscribe(() => {
          unsubscribe();
          expect(store.getState().namespace).to.equal('');
          done();
        });

        store.dispatch({ type: 'UNKNOWN' });
      });
    });

    context('when it is the explain module', () => {
      context('when the action is SWITCHED_TO_TREE_VIEW', () => {
        it('updates the view type in state to "tree"', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.viewType).to.equal('tree');
            done();
          });
          store.dispatch(switchToTreeView());
        });
      });

      context('when the action is SWITCHED_TO_JSON_VIEW', () => {
        it('updates the view type in state to "json"', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.viewType).to.equal('json');
            done();
          });
          store.dispatch(switchToJSONView());
        });
      });

      context('when the action is EXPLAIN_STATE_CHANGED', () => {
        const explainState = 'fetching';

        it('updates the view type in state to "json"', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.explainState).to.equal(explainState);
            done();
          });
          store.dispatch(explainStateChanged(explainState));
        });
      });

      context('when the action is EXPLAIN_PLAN_FETCHED', () => {
        const explain = {
          error: null,
          executionSuccess: true,
          executionTimeMillis: 6,
          explainState: 'done',
          inMemorySort: false,
          index: null,
          indexType: 'COLLSCAN',
          isCollectionScan: true,
          isCovered: false,
          isMultiKey: false,
          isSharded: false,
          nReturned: 18801,
          namespace: 'db.coll',
          numShards: 0,
          parsedQuery: {},
          rawExplainObject: {},
          totalDocsExamined: 18801,
          totalKeysExamined: 0,
          usedIndex: null,
          viewType: 'tree'
        };

        it('updates the explain in state', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain).to.deep.equal(explain);
            done();
          });
          store.dispatch(explainPlanFetched(explain));
        });
      });
    });

    context('when it is the tree-stages module', () => {
      context('when the action is TREE_STAGES_CHANGED', () => {
        const explain = {
          error: null,
          executionSuccess: true,
          executionTimeMillis: 6,
          explainState: 'done',
          inMemorySort: false,
          index: null,
          indexType: 'COLLSCAN',
          isCollectionScan: true,
          isCovered: false,
          isMultiKey: false,
          isSharded: false,
          nReturned: 18801,
          namespace: 'db.coll',
          numShards: 0,
          parsedQuery: {},
          rawExplainObject: {},
          totalDocsExamined: 18801,
          totalKeysExamined: 0,
          usedIndex: null,
          viewType: 'tree'
        };

        it('updates the treeStages in state', (done) => {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().treeStages).to.deep.equal({
              nodes: [],
              links: [],
              width: 0,
              height: 0
            });
            done();
          });
          store.dispatch(treeStagesChanged(explain));
        });
      });
    });
  });
});
