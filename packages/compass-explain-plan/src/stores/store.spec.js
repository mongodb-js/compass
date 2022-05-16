import { expect } from 'chai';
import { omit } from 'lodash';
import AppRegistry from 'hadron-app-registry';
import { activate } from '@mongodb-js/compass-field-store';

import configureStore from './';
import {
  switchToTreeView,
  switchToJSONView,
  explainStateChanged,
  explainPlanFetched,
} from '../modules/explain';
import { treeStagesChanged } from '../modules/tree-stages';

describe('Explain Plan Store', function () {
  let store;
  const appRegistry = new AppRegistry();

  beforeEach(function () {
    store = configureStore({
      localAppRegistry: appRegistry,
      namespace: 'db.coll',
      dataProvider: {
        error: 'error',
        dataProvider: 'ds',
      },
    });
  });

  describe('#onActivated', function () {
    beforeEach(function () {
      activate(appRegistry);
    });

    context('when indexes are connected', function () {
      beforeEach(function () {
        appRegistry.emit('indexes-changed', [{ fields: {} }]);
      });

      it('sets the data service in the state', function () {
        expect(store.getState().indexes).to.deep.equal([{ fields: {} }]);
      });
    });

    context('when the collection is changed', function () {
      context('when there is a collection', function () {
        beforeEach(function () {
          appRegistry.emit('collection-changed', 'db.coll');
        });

        it('updates the namespace in the store', function () {
          expect(store.getState().namespace).to.equal('db.coll');
        });
      });
    });

    context('when the data service is connected', function () {
      it('sets the data service in the state', function () {
        expect(store.getState().dataService.dataService).to.equal('ds');
      });

      it('sets the error in the state', function () {
        expect(store.getState().dataService.error).to.equal('error');
      });
    });

    context('when the query is changed', function () {
      const query = {
        filter: {},
        sort: null,
        project: null,
        skip: 0,
        limit: 0,
        collation: null,
        isChanged: true,
      };

      beforeEach(function () {
        appRegistry.emit('query-changed', query);
      });

      it('sets the server version in the state', function () {
        expect(store.getState().query).to.deep.equal(query);
      });
    });
  });

  describe('#dispatch', function () {
    context('when it is the explain module', function () {
      context('when the action is SWITCHED_TO_TREE_VIEW', function () {
        it('updates the view type in state to "tree"', function (done) {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.viewType).to.equal('tree');
            done();
          });
          store.dispatch(switchToTreeView());
        });
      });

      context('when the action is SWITCHED_TO_JSON_VIEW', function () {
        it('updates the view type in state to "json"', function (done) {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.viewType).to.equal('json');
            done();
          });
          store.dispatch(switchToJSONView());
        });
      });

      context('when the action is EXPLAIN_STATE_CHANGED', function () {
        const explainState = 'executed';

        it('updates the view type in state to "json"', function (done) {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.explainState).to.equal(
              explainState
            );
            done();
          });
          store.dispatch(explainStateChanged(explainState));
        });
      });

      context('when the action is EXPLAIN_PLAN_FETCHED', function () {
        const explain = {
          error: null,
          errorParsing: false,
          executionSuccess: true,
          executionTimeMillis: 6,
          explainState: 'executed',
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
          executionStats: {},
          originalExplainData: {},
          totalDocsExamined: 18801,
          totalKeysExamined: 0,
          usedIndexes: [],
          viewType: 'tree',
        };

        it('updates the explain in state', function (done) {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(omit(store.getState().explain, 'resultId')).to.deep.equal(
              explain
            );
            done();
          });
          store.dispatch(explainPlanFetched(explain));
        });
      });
    });

    context('when it is the tree-stages module', function () {
      context('when the action is TREE_STAGES_CHANGED', function () {
        const explain = {
          error: null,
          executionSuccess: true,
          executionTimeMillis: 6,
          explainState: 'executed',
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
          executionStats: {},
          totalDocsExamined: 18801,
          totalKeysExamined: 0,
          usedIndexes: [],
          viewType: 'tree',
        };

        it('updates the treeStages in state', function (done) {
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().treeStages).to.deep.equal({
              nodes: [],
              links: [],
              width: 0,
              height: 0,
            });
            done();
          });
          store.dispatch(treeStagesChanged(explain));
        });
      });
    });
  });
});
