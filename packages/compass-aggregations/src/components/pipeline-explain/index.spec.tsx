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

    userEvent.click(within(modal).getByText(/cancel/gi), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onCancelExplainSpy.callCount).to.equal(1);
  });

  it('renders error state', function () {
    renderPipelineExplain({
      error: 'Error occurred',
    });
    const modal = screen.getByTestId('pipeline-explain-modal');
    expect(within(modal).getByTestId('pipeline-explain-error')).to.exist;
    expect(within(modal).findByText('Error occurred')).to.exist;
    expect(() => {
      within(modal).getByTestId('pipeline-explain-retry-button');
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
  });

  it('renders explain results - with stats', function () {
    renderPipelineExplain({
      explain: {
        stats: {
          executionTimeMillis: 20,
          nReturned: 100,
          indexes: [],
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
    expect(() => {
      within(summary).getByText(/query used the following indexes/gi);
    }).to.throw;
  });

  it('renders explain results - indexes', function () {
    renderPipelineExplain({
      explain: {
        stats: {
          executionTimeMillis: 20,
          nReturned: 100,
          indexes: [
            {
              name: 'compound_index',
              shard: 'shard1',
              key: { host_id: 1, location: '2dsphere' },
            },
            {
              name: 'compound_index',
              shard: 'shard2',
              key: { city_id: -1, title: 'text' },
            },
          ],
        },
        plan: {
          stages: [],
        },
      },
    });
    const summary = screen.getByTestId('pipeline-explain-results-summary');

    // Toggle first accordian
    userEvent.click(
      within(summary).getByTestId('explain-index-button-compound_index-shard1')
    );
    const indexContent1 = within(summary).getByTestId(
      'explain-index-content-compound_index-shard1'
    );
    expect(indexContent1).to.exist;

    expect(within(indexContent1).getByText(/host_id/gi)).to.exist;
    expect(
      within(indexContent1).getByRole('img', {
        name: /ascending index/i, // host_id index direction 1
      })
    ).to.exist;
    expect(within(indexContent1).getByText(/location/i)).to.exist;
    expect(within(indexContent1).getByText(/\(2dsphere\)/i)).to.exist;

    // Toggle second accordian
    userEvent.click(
      within(summary).getByTestId('explain-index-button-compound_index-shard2')
    );
    const indexContent2 = within(summary).getByTestId(
      'explain-index-content-compound_index-shard2'
    );
    expect(indexContent2).to.exist;

    expect(within(indexContent2).getByText(/city_id/gi)).to.exist;
    expect(
      within(indexContent2).getByRole('img', {
        name: /descending index/i, // city_id index direction -1
      })
    ).to.exist;
    expect(within(indexContent2).getByText(/title/i)).to.exist;
    expect(within(indexContent2).getByText(/\(text\)/i)).to.exist;
  });
});
