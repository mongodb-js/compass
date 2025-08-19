import React from 'react';
import { expect } from 'chai';
import {
  cleanup,
  screen,
  render as _render,
} from '@mongodb-js/testing-library-compass';
import type { ExplainPlanModalProps } from './explain-plan-modal';
import { ExplainPlanModal } from './explain-plan-modal';
import { Provider } from 'react-redux';
import { activatePlugin } from '../stores';

function render(
  props: Partial<ExplainPlanModalProps>,
  { preferences }: { preferences: { enableAIAssistant: boolean } } = {
    preferences: { enableAIAssistant: false },
  }
) {
  const { store } = activatePlugin(
    { namespace: 'test.test', isDataLake: false },
    {
      dataService: {},
      localAppRegistry: {},
    } as any,
    { on() {}, cleanup() {} } as any
  );

  return _render(
    <Provider store={store}>
      <ExplainPlanModal
        namespace="test.test"
        isDataLake={false}
        isModalOpen={true}
        onModalClose={() => {}}
        {...props}
      ></ExplainPlanModal>
    </Provider>,
    { preferences: { enableAIAssistant: preferences?.enableAIAssistant } }
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

  it('should show "Interpret for me" button when AI assistant is enabled', function () {
    render({ status: 'ready' }, { preferences: { enableAIAssistant: true } });
    expect(screen.getByTestId('interpret-for-me-button')).to.exist;
  });

  it('should not show "Interpret for me" button when AI assistant is disabled', function () {
    render({ status: 'ready' }, { preferences: { enableAIAssistant: false } });
    expect(screen.queryByTestId('interpret-for-me-button')).to.not.exist;
  });

  it('should disable the "Interpret for me" button when the status is not ready', function () {
    render({ status: 'loading' }, { preferences: { enableAIAssistant: true } });
    expect(screen.getByTestId('interpret-for-me-button')).to.have.attr(
      'aria-disabled',
      'true'
    );
  });
});
