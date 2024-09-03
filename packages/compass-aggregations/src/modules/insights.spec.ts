import { fetchExplainForPipeline } from './insights';
import Sinon from 'sinon';
import { expect } from 'chai';
import configureStore from '../../test/configure-store';

const simpleExplain = {
  queryPlanner: {
    plannerVersion: 1,
    namespace: 'Corporate-Registrations.corporations',
    indexFilterSet: false,
    parsedQuery: {},
    optimizedPipeline: true,
    winningPlan: {
      stage: 'COLLSCAN',
      direction: 'forward',
    },
    rejectedPlans: [],
  },
};

const explainWithIndex = {
  queryPlanner: {
    plannerVersion: 1,
    namespace: 'Corporate-Registrations.corporations',
    indexFilterSet: false,
    parsedQuery: {
      _id: {
        $eq: {
          $oid: '572cc06fd2fc210e7c3a65f6',
        },
      },
    },
    optimizedPipeline: true,
    winningPlan: {
      stage: 'IDHACK',
    },
    rejectedPlans: [],
  },
};

describe('fetchExplainForPipeline', function () {
  it('should set isCollectionScan to true when explain returned no used indexes', async function () {
    const dataService: any = {
      explainAggregate: Sinon.stub().resolves(simpleExplain),
    };

    const store = (
      await configureStore(
        {
          namespace: 'test.test',
        },
        dataService
      )
    ).plugin.store;

    await store.dispatch(fetchExplainForPipeline());

    expect(store.getState()).to.have.nested.property(
      'insights.isCollectionScan',
      true
    );
  });

  it('should set isCollectionScan to false if index was used', async function () {
    const dataService: any = {
      explainAggregate: Sinon.stub().resolves(explainWithIndex),
    };

    const store = (
      await configureStore(
        {
          namespace: 'test.test',
        },
        dataService
      )
    ).plugin.store;

    await store.dispatch(fetchExplainForPipeline());

    expect(store.getState()).to.have.nested.property(
      'insights.isCollectionScan',
      false
    );
  });

  it('should debounce fetch calls', async function () {
    const dataService: any = {
      explainAggregate: Sinon.stub().resolves(explainWithIndex),
    };

    const store = (
      await configureStore(
        {
          namespace: 'test.test',
        },
        dataService
      )
    ).plugin.store;

    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());

    await store.dispatch(fetchExplainForPipeline());

    expect(dataService.explainAggregate).to.be.calledOnce;
  });

  it('should remove $out stage before passing pipeline to explain', async function () {
    const dataService: any = {
      explainAggregate: Sinon.stub().resolves(simpleExplain),
      isCancelError: Sinon.stub().returns(false),
    };

    const store = (
      await configureStore(
        {
          namespace: 'test.test',
          pipeline: [{ $match: { foo: 1 } }, { $out: 'test' }],
        },
        dataService
      )
    ).plugin.store;

    await store.dispatch(fetchExplainForPipeline());

    expect(dataService.explainAggregate).to.be.calledWith('test.test', [
      { $match: { foo: 1 } },
    ]);
  });

  it('should remove $merge stage before passing pipeline to explain', async function () {
    const dataService: any = {
      explainAggregate: Sinon.stub().resolves(simpleExplain),
      isCancelError: Sinon.stub().returns(false),
    };

    const store = (
      await configureStore(
        {
          namespace: 'test.test',
          pipeline: [{ $merge: { into: 'test' } }, { $match: { bar: 2 } }],
        },
        dataService
      )
    ).plugin.store;

    await store.dispatch(fetchExplainForPipeline());

    expect(dataService.explainAggregate).to.be.calledWith('test.test', [
      { $match: { bar: 2 } },
    ]);
  });
});
