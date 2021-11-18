/* eslint-disable react/prop-types */
import React from 'react';
import { render, screen, cleanup, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import { ContentWithFallback } from './content-with-fallback';

describe('ContentWithFallback', function () {
  afterEach(cleanup);

  function TestContentWithFallback({
    isContentReady,
    fallbackTimeout,
    contentAfterFallbackTimeout,
  }: {
    isContentReady: boolean;
    fallbackTimeout?: number;
    contentAfterFallbackTimeout?: number;
  }) {
    return (
      <ContentWithFallback
        content={(ready, animate) =>
          ready && (
            <div data-animated={String(animate)} data-testid="ready">
              I am ready!
            </div>
          )
        }
        fallback={(notReady) =>
          notReady && <div data-testid="fallback">I am not ready yet!</div>
        }
        isContentReady={isContentReady}
        fallbackTimeout={fallbackTimeout}
        contentAfterFallbackTimeout={contentAfterFallbackTimeout}
      ></ContentWithFallback>
    );
  }

  it('should render content immediately if content is ready on the first render', function () {
    render(
      <TestContentWithFallback isContentReady={true}></TestContentWithFallback>
    );

    expect(screen.getByText('I am ready!')).to.exist;
  });

  it('should render nothing when content is not ready on the first render', function () {
    const container = document.createElement('div');

    render(
      <TestContentWithFallback
        isContentReady={false}
      ></TestContentWithFallback>,
      { container }
    );

    expect(container).to.be.empty;
  });

  it('should render fallback when the timeout passes', async function () {
    render(
      <TestContentWithFallback
        isContentReady={false}
        fallbackTimeout={0}
      ></TestContentWithFallback>
    );

    await waitFor(() => screen.getByText('I am not ready yet!'));
  });

  it('should render content with animation if rendered after fallback', async function () {
    const { rerender } = render(
      <TestContentWithFallback
        isContentReady={false}
        fallbackTimeout={0}
        contentAfterFallbackTimeout={0}
      ></TestContentWithFallback>
    );

    await waitFor(() => screen.getByText('I am not ready yet!'));

    rerender(
      <TestContentWithFallback
        isContentReady={true}
        fallbackTimeout={0}
        contentAfterFallbackTimeout={0}
      ></TestContentWithFallback>
    );

    await waitFor(() => screen.getByText('I am ready!'));

    expect(screen.getByText('I am ready!')).to.have.attribute(
      'data-animated',
      'true'
    );
  });
});
