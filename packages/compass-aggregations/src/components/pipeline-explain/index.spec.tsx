import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { spy } from 'sinon';
import { expect } from 'chai';

import { PipelineExplain } from './index';

const renderPipelineExplain = (
  props: Partial<ComponentProps<typeof PipelineExplain>> = {}
) => {
  render(
    <PipelineExplain
      isLoading={false}
      isModalOpen={true}
      onCancelExplain={() => {}}
      onCloseModal={() => {}}
      onRunExplain={() => {}}
      {...props}
    />
  );
};

describe('PipelineExplain', function () {
  it('renders loading state', function () {
    const onCancelExplainSpy = spy();
    renderPipelineExplain({
      isLoading: true,
      onCancelExplain: onCancelExplainSpy,
    });
    const modal = screen.getByTestId('pipeline-explain-modal');
    expect(within(modal).getByTestId('pipeline-explain-cancel')).to.exist;
    expect(onCancelExplainSpy.callCount).to.equal(0);

    userEvent.click(within(modal).getByText(/cancel/gi), null, {
      skipPointerEventsCheck: true,
    });
    expect(onCancelExplainSpy.callCount).to.equal(1);

    expect(() => {
      within(modal).getByTestId('pipeline-explain-footer-close-button');
    }, 'does not show footer in loading state').to.throw;
  });

  it('renders error state - non-network error', function () {
    renderPipelineExplain({
      error: {
        isNetworkError: false,
        message: 'Error occurred',
      },
    });
    const modal = screen.getByTestId('pipeline-explain-modal');
    expect(within(modal).getByTestId('pipeline-explain-error')).to.exist;
    expect(within(modal).findByText('Error occurred')).to.exist;
    expect(() => {
      within(modal).getByTestId('pipeline-explain-retry-button');
    }).to.throw;

    expect(within(modal).getByTestId('pipeline-explain-footer-close-button')).to
      .exist;
  });

  it('renders error state - network error', function () {
    const onRunExplainSpy = spy();
    renderPipelineExplain({
      error: {
        isNetworkError: true,
        message: 'Error occurred',
      },
      onRunExplain: onRunExplainSpy,
    });
    const modal = screen.getByTestId('pipeline-explain-modal');
    expect(within(modal).getByTestId('pipeline-explain-error')).to.exist;
    expect(within(modal).findByText('Oops! Looks like we hit a network issue.'))
      .to.exist;
    // when the modal is open, onRunExplain is called to fetch the explain
    expect(onRunExplainSpy.callCount).to.equal(1);

    expect(within(modal).getByTestId('pipeline-explain-retry-button')).to.exist;
    userEvent.click(within(modal).getByTestId('pipeline-explain-retry-button'));
    expect(onRunExplainSpy.callCount).to.equal(2);

    expect(() => {
      within(modal).getByTestId('pipeline-explain-footer-close-button'),
        'does not render footer in network error state';
    }).to.throw;
  });

  it('renders explain results - without stats', function () {
    renderPipelineExplain({
      explain: {
        plan: {
          stages: [],
        },
      },
    });
    const results = screen.getByTestId('pipeline-explain-results');
    expect(within(results).getByTestId('pipeline-explain-results-json')).to
      .exist;
    expect(() => {
      within(results).getByTestId('pipeline-explain-results-summary');
    }).to.throw;

    expect(screen.getByTestId('pipeline-explain-footer-close-button')).to.exist;
  });

  it('renders explain results - with stats', function () {
    renderPipelineExplain({
      explain: {
        stats: {
          executionTimeMillis: 20,
          nReturned: 100,
          usedIndexes: [{ index: 'name', shard: 'shard1' }],
        },
        plan: {
          stages: [],
        },
      },
    });
    const results = screen.getByTestId('pipeline-explain-results');
    expect(results).to.exist;
    expect(within(results).getByTestId('pipeline-explain-results-json')).to
      .exist;

    const summary = within(results).getByTestId(
      'pipeline-explain-results-summary'
    );
    expect(summary).to.exist;

    expect(within(summary).getByText(/documents returned/gi)).to.exist;
    expect(within(summary).getByText(/actual query execution time/gi)).to.exist;
    expect(within(summary).getByText(/query used the following indexes/gi)).to
      .exist;

    expect(screen.getByTestId('pipeline-explain-footer-close-button')).to.exist;
  });
});
