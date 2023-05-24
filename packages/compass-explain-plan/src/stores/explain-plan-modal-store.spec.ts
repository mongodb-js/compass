import AppRegistry from 'hadron-app-registry';
import type { ExplainPlanModalConfigureStoreOptions } from './explain-plan-modal-store';
import {
  closeExplainPlanModal,
  configureStore,
  openExplainPlanModal,
} from './explain-plan-modal-store';
import { expect } from 'chai';

const localAppRegistry = new AppRegistry();

const dataProvider: ExplainPlanModalConfigureStoreOptions['dataProvider'] = {
  dataProvider: {
    explainAggregate() {
      return Promise.resolve({
        queryPlanner: {
          plannerVersion: 1,
          namespace: 'test.test',
          indexFilterSet: false,
          parsedQuery: {},
          optimizedPipeline: true,
          winningPlan: {
            stage: 'COLLSCAN',
            direction: 'forward',
          },
          rejectedPlans: [],
        },
        executionStats: {
          executionSuccess: true,
          nReturned: 1000,
          executionTimeMillis: 5,
          totalKeysExamined: 0,
          totalDocsExamined: 1000,
          executionStages: {
            stage: 'COLLSCAN',
            nReturned: 1000,
            executionTimeMillisEstimate: 0,
            works: 1002,
            advanced: 1000,
            needTime: 1,
            needYield: 0,
            saveState: 1,
            restoreState: 1,
            isEOF: 1,
            direction: 'forward',
            docsExamined: 1000,
          },
          allPlansExecution: [],
        },
        ok: 1,
      });
    },
    isCancelError() {
      return true;
    },
  },
};

describe('explain plan modal store', function () {
  let store: ReturnType<typeof configureStore>;

  beforeEach(function () {
    store = configureStore({
      localAppRegistry,
      dataProvider,
      namespace: 'test.test',
      isDataLake: false,
    });
  });

  it('should open modal on `open-explain-plan-modal` event', function () {
    localAppRegistry.emit('open-explain-plan-modal', {
      aggregation: { pipeline: [] },
    });
    expect(store.getState()).to.have.property('isModalOpen', true);
  });

  it('should fetch explain plan when modal opened', async function () {
    await store.dispatch(
      openExplainPlanModal({ aggregation: { pipeline: [] } })
    );
    expect(store.getState()).to.have.property('status', 'ready');
    expect(store.getState()).to.have.property('explainPlan').not.eq(null);
    expect(store.getState()).to.have.property('rawExplainPlan').not.eq(null);
  });

  it('should close modal on close action', function () {
    store.dispatch(closeExplainPlanModal());
    expect(store.getState()).to.have.property('isModalOpen', false);
  });
});
