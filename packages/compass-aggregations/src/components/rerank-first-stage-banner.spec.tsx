import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import Sinon from 'sinon';
import { AssistantActionsContext } from '@mongodb-js/compass-assistant';
import { RerankFirstStageBanner } from './rerank-first-stage-banner';

const DISMISSED_KEY = 'mongodb_compass_dismissed_rerank_first_stage_banner';

describe('RerankFirstStageBanner', function () {
  afterEach(function () {
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('does not render when enableRerank is false', function () {
    render(<RerankFirstStageBanner data-testid="rerank-first-stage-banner" />, {
      preferences: { enableRerank: false },
    });
    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('renders when enableRerank is true', function () {
    render(<RerankFirstStageBanner data-testid="rerank-first-stage-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.getByTestId('rerank-first-stage-banner')).to.exist;
    expect(
      screen.getByText('$rerank works better following a search stage', {
        exact: false,
      })
    ).to.exist;
  });

  it('dismisses when the close button is clicked', function () {
    render(<RerankFirstStageBanner data-testid="rerank-first-stage-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.getByTestId('rerank-first-stage-banner')).to.exist;

    userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('does not render when already dismissed via localStorage', function () {
    localStorage.setItem(DISMISSED_KEY, 'true');
    render(<RerankFirstStageBanner data-testid="rerank-first-stage-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('renders the Learn more button and calls tellMoreAboutInsight when clicked', function () {
    const tellMoreAboutInsight = Sinon.spy();
    render(
      <AssistantActionsContext.Provider value={{ tellMoreAboutInsight }}>
        <RerankFirstStageBanner data-testid="rerank-first-stage-banner" />
      </AssistantActionsContext.Provider>,
      {
        preferences: {
          enableRerank: true,
          enableAIAssistant: true,
          enableGenAIFeatures: true,
          enableGenAIFeaturesAtlasOrg: true,
          cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
        },
      }
    );
    const btn = screen.getByTestId('rerank-first-stage-learn-more-button');
    expect(btn).to.exist;
    userEvent.click(btn);
    expect(tellMoreAboutInsight.calledOnceWith({ id: 'rerank-first-stage' })).to
      .be.true;
  });
});
