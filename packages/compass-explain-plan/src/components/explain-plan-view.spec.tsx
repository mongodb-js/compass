import React from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import { ExplainPlanView } from './explain-plan-view';
import type { Stage } from '@mongodb-js/explain-plan-helper';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { configureStore } from '../stores/explain-plan-modal-store';

const simpleExplain = new ExplainPlan({
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
} as unknown as Stage).serialize();

describe('ExplainPlanView', function () {
  afterEach(cleanup);

  it('should render explain plan', function () {
    render(
      <Provider
        store={configureStore({
          namespace: 'test.test',
          dataProvider: { dataProvider: {} as any },
          isDataLake: false,
          localAppRegistry: { on() {}, emit() {} } as any,
        })}
      >
        <ExplainPlanView
          explainPlan={simpleExplain}
          rawExplainPlan={simpleExplain.originalExplainData}
        ></ExplainPlanView>
      </Provider>
    );
    expect(screen.getByText('COLLSCAN')).to.exist;
    expect(screen.getByText('Query Performance Summary')).to.exist;
    expect(screen.getByTestId('docsReturned'))
      .to.have.property('textContent')
      .match(/1000\xa0documents returned/);
    expect(screen.getByTestId('docsExamined'))
      .to.have.property('textContent')
      .match(/1000\xa0documents examined/);
    expect(screen.getByTestId('executionTimeMs'))
      .to.have.property('textContent')
      .match(/5\xa0ms\xa0execution time/);
    expect(screen.getByTestId('sortedInMemory'))
      .to.have.property('textContent')
      .match(/Is not\xa0sorted in memory/);
    expect(screen.getByTestId('indexKeysExamined'))
      .to.have.property('textContent')
      .match(/0\xa0index keys examined/);
  });

  it('should render error when there is no explain plan', function () {
    render(<ExplainPlanView error="No explain plan"></ExplainPlanView>);
    expect(screen.getByText('No explain plan')).to.exist;
  });

  it('should render raw explain when explain was not parsed successfully', function () {
    render(
      <ExplainPlanView
        rawExplainPlan={simpleExplain.originalExplainData}
        error="Can't parse explain plan"
      ></ExplainPlanView>
    );
    expect(
      screen.getByText(
        'Visual explain plan is not supported with this query on this collection in this Compass release',
        { exact: false }
      )
    ).to.exist;

    function parentButton(el: Node | null): Node | null {
      if (!el) return null;
      if (el.parentNode?.nodeName === 'BUTTON') return el.parentNode;
      return parentButton(el.parentNode);
    }

    expect(parentButton(screen.getByText('Visual Tree'))).to.have.property(
      'disabled'
    );
    expect(parentButton(screen.getByText('Raw Output'))).to.have.property(
      'disabled'
    );

    const doc = (
      screen.getByTestId('raw-explain-plan') as unknown as { _cm: any }
    )._cm.state.sliceDoc();

    expect(doc).to.eq(`{
  "queryPlanner": {
    "plannerVersion": 1,
    "namespace": "test.test",
    "indexFilterSet": false,
    "parsedQuery": {},
    "optimizedPipeline": true,
    "winningPlan": {
      "stage": "COLLSCAN",
      "direction": "forward"
    },
    "rejectedPlans": []
  },
  "executionStats": {
    "executionSuccess": true,
    "nReturned": 1000,
    "executionTimeMillis": 5,
    "totalKeysExamined": 0,
    "totalDocsExamined": 1000,
    "executionStages": {
      "stage": "COLLSCAN",
      "nReturned": 1000,
      "executionTimeMillisEstimate": 0,
      "works": 1002,
      "advanced": 1000,
      "needTime": 1,
      "needYield": 0,
      "saveState": 1,
      "restoreState": 1,
      "isEOF": 1,
      "direction": "forward",
      "docsExamined": 1000
    },
    "allPlansExecution": []
  },
  "ok": 1
}`);
  });
});
