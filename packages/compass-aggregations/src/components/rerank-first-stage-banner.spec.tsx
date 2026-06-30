import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { RerankFirstStageBanner } from './rerank-first-stage-banner';

const DISMISSED_KEY = 'mongodb_compass_dismissed_rerank_first_stage_banner';

describe('RerankFirstStageBanner', function () {
  afterEach(function () {
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('renders', function () {
    render(<RerankFirstStageBanner />);
    expect(screen.getByTestId('rerank-first-stage-banner')).to.exist;
    expect(
      screen.getByText('$rerank works better following a search stage', {
        exact: false,
      })
    ).to.exist;
  });

  it('dismisses when the close button is clicked', function () {
    render(<RerankFirstStageBanner />);
    expect(screen.getByTestId('rerank-first-stage-banner')).to.exist;

    userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });

  it('does not render when already dismissed via localStorage', function () {
    localStorage.setItem(DISMISSED_KEY, 'true');
    render(<RerankFirstStageBanner />);
    expect(screen.queryByTestId('rerank-first-stage-banner')).to.not.exist;
  });
});
