import React from 'react';
import { expect } from 'chai';
import { cleanup, screen, render as _render } from '@testing-library/react';
import type { ExplainPlanModalProps } from './explain-plan-modal';
import { ExplainPlanModal } from './explain-plan-modal';
import { Provider } from 'react-redux';
import { configureStore } from '../stores/explain-plan-modal-store';

function render(props: Partial<ExplainPlanModalProps>) {
  return _render(
    <Provider
      store={configureStore({
        namespace: 'test.test',
        dataProvider: { dataProvider: {} as any },
        isDataLake: false,
        localAppRegistry: { on() {}, emit() {} } as any,
      })}
    >
      <ExplainPlanModal
        isModalOpen={true}
        onModalClose={() => {}}
        {...props}
      ></ExplainPlanModal>
    </Provider>
  );
}

describe('ExplainPlanModal', function () {
  afterEach(cleanup);

  it('should render loading state', async function () {
    render({ status: 'loading' });
    expect(await screen.findByText('Running explain')).to.exist;
  });

  it('should render error state', async function () {
    render({
      status: 'error',
      error: 'Whoops, error!',
      explainPlan: { usedIndexes: [] } as any,
    });
    expect(await screen.findByText('Whoops, error!')).to.exist;
  });

  it('should render ready state', function () {
    render({ status: 'ready' });
    expect(screen.getByText('Query Performance Summary')).to.exist;
  });
});
