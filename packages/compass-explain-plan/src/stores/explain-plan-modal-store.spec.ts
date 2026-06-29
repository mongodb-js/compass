import AppRegistry, {
  createActivateHelpers,
} from '@mongodb-js/compass-app-registry';
import {
  closeExplainPlanModal,
  openExplainPlanModal,
  openExplainPlanForInterpret,
} from './explain-plan-modal-store';
import type { ExplainPlanModalServices } from './';
import { activatePlugin } from './';
import { expect } from 'chai';
import type { Document } from 'mongodb';
import Sinon from 'sinon';
import type { ConnectionInfoRef } from '@mongodb-js/compass-connections/provider';
import * as compassComponents from '@mongodb-js/compass-components';
import { waitFor } from '@mongodb-js/testing-library-compass';

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
  let deactivatePlugin: () => void;
  let dataService: ExplainPlanModalServices['dataService'];
  let interpretExplainPlanSpy: Sinon.SinonSpy<
    [
      {
        namespace: string;
        explainPlan: string;
        operationType: 'query' | 'aggregation';
      }
    ]
  >;

  function configureStore(
    explainPlan: Document | Error = simplePlan,
    { isCancelError = false }: { isCancelError?: boolean } = {}
  ) {
    const explain = sandbox.stub().callsFake(() => {
      if ((explainPlan as Error).name) {
        return Promise.reject(explainPlan);
      }
      return Promise.resolve(explainPlan);
    });

    dataService = {
      explainAggregate: explain,
      explainFind: explain,
      isCancelError() {
        return isCancelError;
      },
    };

    interpretExplainPlanSpy = sandbox.spy() as typeof interpretExplainPlanSpy;

    const { store, deactivate } = activatePlugin(
      { namespace: 'test.test', isDataLake: false },
      {
        localAppRegistry,
        dataService,
        logger: {
          log: { warn() {}, error() {} },
          mongoLogId() {},
        } as any,
        track: () => {},
        connectionInfoRef: {
          current: {
            id: 'TEST',
          },
        } as ConnectionInfoRef,
        preferences: {
          getPreferences() {
            return { maxTimeMS: 0 };
          },
        } as any,
        compassAssistant: {
          interpretExplainPlan: interpretExplainPlanSpy,
          interpretConnectionError: () => {},
          getIsAssistantEnabled: () => true,
        },
      },
      createActivateHelpers()
    );

    deactivatePlugin = deactivate;

    return store;
  }

  afterEach(function () {
    deactivatePlugin();
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
    expect(dataService?.explainAggregate).to.be.calledWith('test.test', [
      { $match: { foo: 1 } },
    ]);
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
    expect(dataService?.explainAggregate).to.be.calledWith('test.test', [
      { $match: { bar: 2 } },
    ]);
  });

  it('should set operationType to "query" when query is passed', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanModal({
        query: { filter: { foo: 1 } },
      })
    );
    expect(store.getState()).to.have.property('operationType', 'query');
  });

  it('should set operationType to "aggregation" when aggregation is passed', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanModal({
        aggregation: { pipeline: [{ $match: { foo: 1 } }] },
      })
    );
    expect(store.getState()).to.have.property('operationType', 'aggregation');
  });

  it('should call interpretExplainPlan when explain is opened for interpret', async function () {
    const store = configureStore();
    await store.dispatch(
      openExplainPlanForInterpret({ query: { filter: { foo: 1 } } })
    );
    expect(interpretExplainPlanSpy).to.have.been.calledOnce;
    expect(interpretExplainPlanSpy.firstCall.args[0]).to.have.property(
      'operationType',
      'query'
    );
    expect(interpretExplainPlanSpy.firstCall.args[0]).to.have.property(
      'namespace',
      'test.test'
    );
    expect(interpretExplainPlanSpy.firstCall.args[0].explainPlan).to.be.a(
      'string'
    );
    expect(store.getState()).to.have.property('isModalOpen', false);
  });

  describe('openExplainPlanForInterpret loading events', function () {
    let emitSpy: Sinon.SinonSpy;
    let openToastStub: Sinon.SinonStub;

    beforeEach(function () {
      emitSpy = sandbox.spy(localAppRegistry, 'emit');
      openToastStub = sandbox.stub();
      sandbox.replaceGetter(
        compassComponents,
        'openToast',
        () => openToastStub
      );
    });

    afterEach(function () {
      sandbox.restore();
    });

    it('emits loading and done events on success', async function () {
      configureStore();
      localAppRegistry.emit('open-explain-plan-for-interpret', {
        query: { filter: {} },
      });
      await waitFor(() => {
        expect(emitSpy.calledWith('explain-plan-interpret-started')).to.be.true;
        expect(emitSpy.calledWith('explain-plan-interpret-finished')).to.be
          .true;
      });
    });

    it('emits done and shows toast when fetch fails', async function () {
      configureStore(new Error('network error'));
      localAppRegistry.emit('open-explain-plan-for-interpret', {
        query: { filter: {} },
      });
      await waitFor(() => {
        expect(emitSpy.calledWith('explain-plan-interpret-finished')).to.be
          .true;
        expect(openToastStub.calledOnce).to.be.true;
        expect(openToastStub.firstCall.args[0]).to.equal(
          'explain-interpret-error'
        );
      });
    });

    it('emits done but shows no toast on cancellation', async function () {
      configureStore(new Error('cancel'), { isCancelError: true });
      localAppRegistry.emit('open-explain-plan-for-interpret', {
        query: { filter: {} },
      });
      await waitFor(() => {
        expect(openToastStub.called).to.be.false;
      });
    });
  });
});
