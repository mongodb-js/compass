import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import {
  RerankFirstStageBanner,
  RerankBannerDismissProvider,
} from './rerank-first-stage-banner';

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
    render(
      <RerankBannerDismissProvider>
        <RerankFirstStageBanner data-testid="rerank-first-stage-banner" />
      </RerankBannerDismissProvider>,
      { preferences: { enableRerank: true } }
    );
    expect(screen.getByTestId('rerank-first-stage-banner')).to.exist;

    userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('does not render when already dismissed via localStorage', function () {
    localStorage.setItem(DISMISSED_KEY, 'true');
    render(
      <RerankBannerDismissProvider>
        <RerankFirstStageBanner data-testid="rerank-first-stage-banner" />
      </RerankBannerDismissProvider>,
      { preferences: { enableRerank: true } }
    );
    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('dismissing one banner instance dismisses all others sharing the same provider', function () {
    render(
      <RerankBannerDismissProvider>
        <RerankFirstStageBanner data-testid="banner-1" />
        <RerankFirstStageBanner data-testid="banner-2" />
      </RerankBannerDismissProvider>,
      { preferences: { enableRerank: true } }
    );
    expect(screen.getByTestId('banner-1')).to.exist;
    expect(screen.getByTestId('banner-2')).to.exist;

    userEvent.click(screen.getAllByRole('button', { name: /close/i })[0]);

    expect(screen.queryByTestId('banner-1')).to.not.exist;
    expect(screen.queryByTestId('banner-2')).to.not.exist;
  });
});
