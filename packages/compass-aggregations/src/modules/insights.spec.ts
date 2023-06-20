import { fetchExplainForPipeline } from './insights';
import Sinon from 'sinon';
import configureStore from '../stores/store';
import { expect } from 'chai';

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
    const dataService = {
      explainAggregate: Sinon.stub().resolves(simpleExplain),
    };

    const store = configureStore({
      namespace: 'test.test',
      dataProvider: { dataProvider: dataService as any },
    });

    await store.dispatch(fetchExplainForPipeline());

    expect(store.getState()).to.have.nested.property(
      'insights.isCollectionScan',
      true
    );
  });

  it('should set isCollectionScan to false if index was used', async function () {
    const dataService = {
      explainAggregate: Sinon.stub().resolves(explainWithIndex),
    };

    const store = configureStore({
      namespace: 'test.test',
      dataProvider: { dataProvider: dataService as any },
    });

    await store.dispatch(fetchExplainForPipeline());

    expect(store.getState()).to.have.nested.property(
      'insights.isCollectionScan',
      false
    );
  });

  it('should debounce fetch calls', async function () {
    const dataService = {
      explainAggregate: Sinon.stub().resolves(explainWithIndex),
    };

    const store = configureStore({
      namespace: 'test.test',
      dataProvider: { dataProvider: dataService as any },
    });

    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());
    void store.dispatch(fetchExplainForPipeline());
    await store.dispatch(fetchExplainForPipeline());

    expect(dataService.explainAggregate).to.be.calledOnce;
  });
});
