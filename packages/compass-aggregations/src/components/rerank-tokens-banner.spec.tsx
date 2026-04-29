import React from 'react';
import { render, screen, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { RerankTokensBanner } from './rerank-tokens-banner';

const DISMISSED_KEY = 'mongodb_compass_dismissed_rerank_tokens_banner';

describe('RerankTokensBanner', function () {
  afterEach(function () {
    localStorage.removeItem(DISMISSED_KEY);
  });

  it('does not render when enableRerank is false', function () {
    render(<RerankTokensBanner data-testid="rerank-tokens-banner" />, {
      preferences: { enableRerank: false },
    });
    expect(screen.queryByTestId('rerank-tokens-banner')).to.not.exist;
  });

  it('renders when enableRerank is true', function () {
    render(<RerankTokensBanner data-testid="rerank-tokens-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.getByTestId('rerank-tokens-banner')).to.exist;
    expect(screen.getByText('$rerank consumes tokens')).to.exist;
  });

  it('dismisses when the close button is clicked', function () {
    render(<RerankTokensBanner data-testid="rerank-tokens-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.getByTestId('rerank-tokens-banner')).to.exist;

    userEvent.click(screen.getByRole('button', { name: /close/i }));

    expect(screen.queryByTestId('rerank-tokens-banner')).to.not.exist;
  });

  it('does not render when already dismissed via localStorage', function () {
    localStorage.setItem(DISMISSED_KEY, 'true');
    render(<RerankTokensBanner data-testid="rerank-tokens-banner" />, {
      preferences: { enableRerank: true },
    });
    expect(screen.queryByTestId('rerank-tokens-banner')).to.not.exist;
  });
});
