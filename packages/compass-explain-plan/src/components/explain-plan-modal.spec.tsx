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
import type { AllPreferences } from 'compass-preferences-model';

function render(
  props: Partial<ExplainPlanModalProps>,
  {
    preferences,
  }: {
    preferences: Partial<AllPreferences>;
  } = {
    preferences: {},
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
    { preferences }
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

  it('should show "Interpret" button when AI assistant is enabled', function () {
    render(
      {
        status: 'ready',
        explainPlan: {
          namespace: 'test',
          usedIndexes: [],
        } as any,
      },
      {
        preferences: {
          enableAIAssistant: true,
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          cloudFeatureRolloutAccess: {
            GEN_AI_COMPASS: true,
          },
        },
      }
    );
    expect(screen.getByTestId('interpret-for-me-button')).to.exist;
    expect(screen.getByTestId('interpret-for-me-button')).to.have.attr(
      'aria-disabled',
      'false'
    );
  });

  it('should disable the "Interpret" button when the status is not ready', function () {
    render(
      {
        status: 'loading',
        explainPlan: {
          usedIndexes: [],
        } as any,
      },
      {
        preferences: {
          enableAIAssistant: true,
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
        },
      }
    );
    expect(screen.getByTestId('interpret-for-me-button')).to.have.attr(
      'aria-disabled',
      'true'
    );
  });
});
