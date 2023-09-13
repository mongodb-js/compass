import AppRegistry from 'hadron-app-registry';
import type { ExplainPlanModalConfigureStoreOptions } from './explain-plan-modal-store';
import {
  closeExplainPlanModal,
  configureStore as _configureStore,
  openExplainPlanModal,
} from './explain-plan-modal-store';
import { expect } from 'chai';
import type { Document } from 'mongodb';
import Sinon from 'sinon';

const localAppRegistry = new AppRegistry();

const simplePlan = {
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
};

describe('explain plan modal store', function () {
  const sandbox = Sinon.createSandbox();
  let dataProvider: ExplainPlanModalConfigureStoreOptions['dataProvider'];

  function configureStore(explainPlan: Document | Error = simplePlan) {
    const explain = sandbox.stub().callsFake(() => {
      if ((explainPlan as Error).name) {
        return Promise.reject(explainPlan);
      }
      return Promise.resolve(explainPlan);
    });

    dataProvider = {
      dataProvider: {
        explainAggregate: explain,
        explainFind: explain,
        isCancelError() {
          return false;
        },
      },
    };

    return _configureStore({
      localAppRegistry,
      dataProvider,
      namespace: 'test.test',
      isDataLake: false,
    });
  }

  afterEach(function () {
    sandbox.resetHistory();
  });

  it('should open modal on `open-explain-plan-modal` event', function () {
    const store = configureStore();
    localAppRegistry.emit('open-explain-plan-modal', {
      aggregation: { pipeline: [] },
    });
    expect(store.getState()).to.have.property('isModalOpen', true);
  });

  it('should fetch aggregation explain plan when modal opened', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanModal({ aggregation: { pipeline: [] } })
    );
    expect(store.getState()).to.have.property('status', 'ready');
    expect(store.getState()).to.have.property('explainPlan').not.eq(null);
    expect(store.getState()).to.have.property('rawExplainPlan').not.eq(null);
  });

  it('should fetch query explain plan when modal opened', async function () {
    const store = configureStore();
    await store.dispatch(openExplainPlanModal({ query: { filter: {} } }));
    expect(store.getState()).to.have.property('status', 'ready');
    expect(store.getState()).to.have.property('explainPlan').not.eq(null);
    expect(store.getState()).to.have.property('rawExplainPlan').not.eq(null);
  });

  it('should keep error if explain throws', async function () {
    const store = configureStore(new Error('Failed to explain'));
    await store.dispatch(openExplainPlanModal({ query: { filter: {} } }));
    expect(store.getState()).to.have.property('status', 'error');
    expect(store.getState()).to.have.property('error', 'Failed to explain');
    expect(store.getState()).to.have.property('explainPlan', null);
    expect(store.getState()).to.have.property('rawExplainPlan', null);
  });

  it('should set rawExplain if explain resolved but parsing failed', async function () {
    const rawExplain = {};
    const store = configureStore(rawExplain);
    await store.dispatch(openExplainPlanModal({ query: { filter: {} } }));
    expect(store.getState()).to.have.property('status', 'error');
    expect(store.getState()).to.have.property('explainPlan', null);
    expect(store.getState()).to.have.property('rawExplainPlan', rawExplain);
  });

  it('should close modal on close action', function () {
    const store = configureStore();
    store.dispatch(closeExplainPlanModal());
    expect(store.getState()).to.have.property('isModalOpen', false);
  });

  it('should remove $out stage before passing pipeline to explain', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanModal({
        aggregation: { pipeline: [{ $match: { foo: 1 } }, { $out: 'test' }] },
      })
    );
    expect(dataProvider?.dataProvider?.explainAggregate).to.be.calledWith(
      'test.test',
      [{ $match: { foo: 1 } }]
    );
  });

  it('should remove $merge stage before passing pipeline to explain', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanModal({
        aggregation: {
          pipeline: [{ $merge: { into: 'test' } }, { $match: { bar: 2 } }],
        },
      })
    );
    expect(dataProvider?.dataProvider?.explainAggregate).to.be.calledWith(
      'test.test',
      [{ $match: { bar: 2 } }]
    );
  });
});
