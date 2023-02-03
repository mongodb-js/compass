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
  startExplainPlan,
  cancelExplainPlan,
} from '../modules/explain';
import explainStates from '../constants/explain-states';

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
        it('marks the start of explain plan"', function (done) {
          const explainState = explainStates.REQUESTED;
          const abortController = new AbortController();
          const oldExplain = null;
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.explainState).to.equal(
              explainState
            );
            expect(store.getState().explain.abortController).to.equal(
              abortController
            );
            expect(store.getState().explain.oldExplain).to.deep.equal(
              oldExplain
            );
            done();
          });
          store.dispatch(startExplainPlan(abortController, oldExplain));
        });

        it('marks the completion of explain plan', function (done) {
          const explainState = explainStates.EXECUTED;
          const unsubscribe = store.subscribe(() => {
            unsubscribe();
            expect(store.getState().explain.explainState).to.equal(
              explainState
            );
            expect(store.getState().explain.abortController).to.be.null;
            expect(store.getState().explain.oldExplain).to.be.null;
            done();
          });
          store.dispatch(explainStateChanged(explainState));
        });

        it('cancels the ongoing request to explain plan', function (done) {
          const abortController = new AbortController();
          const oldExplain = {
            explainState: 'initial',
          };
          let timeout;
          const unsubscribe = store.subscribe(async () => {
            if (timeout) return;
            timeout = setTimeout(() => {
              unsubscribe();
              expect(abortController.signal.aborted).to.be.true;
              expect(store.getState().explain).to.deep.equal(oldExplain);
              done();
            });
          });
          store.dispatch(startExplainPlan(abortController, oldExplain));
          store.dispatch(cancelExplainPlan());
        });
      });

      context('when the action is EXPLAIN_PLAN_FETCHED', function () {
        const explain = {
          error: null,
          errorParsing: false,
          abortController: null,
          oldExplain: null,
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
  });
});
