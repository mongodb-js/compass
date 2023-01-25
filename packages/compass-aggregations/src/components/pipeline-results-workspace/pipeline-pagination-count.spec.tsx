import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import { PipelinePaginationCount } from './pipeline-pagination-count';

const renderPipelinePaginationCount = (
  props: Partial<ComponentProps<typeof PipelinePaginationCount>> = {}
) => {
  render(
    <PipelinePaginationCount
      loading={false}
      count={undefined}
      onCount={() => {}}
      onRefresh={() => {}}
      {...props}
    />
  );
  return screen.getByTestId('pipeline-pagination-count');
};

describe('PipelinePaginationCount', function () {
  it('renders count of results', function () {
    const container = renderPipelinePaginationCount({ count: 20 });
    expect(within(container).getByText('of 20')).to.exist;
  });

  it('renders count button and calls onCount when clicked', function () {
    const onCountSpy = spy();
    const container = renderPipelinePaginationCount({ onCount: onCountSpy });

    const countButton = within(container).getByTestId(
      'pipeline-pagination-count-action'
    );
    expect(countButton).to.exist;

    expect(onCountSpy.calledOnce).to.be.false;
    userEvent.click(countButton);
    expect(onCountSpy.calledOnce).to.be.true;
  });

  it('renders refresh button and calls onRefresh when clicked', function () {
    const onRefreshSpy = spy();
    const container = renderPipelinePaginationCount({
      count: 20,
      onRefresh: onRefreshSpy,
    });

    const refreshButton = within(container).getByTestId(
      'pipeline-pagination-refresh-count-action'
    );
    expect(refreshButton).to.exist;

    expect(onRefreshSpy.calledOnce).to.be.false;
    userEvent.click(refreshButton);
    expect(onRefreshSpy.calledOnce).to.be.true;
  });

  it('renders spinner when counting documents', function () {
    const container = renderPipelinePaginationCount({ loading: true });
    expect(within(container).getByTitle(/Counting documents/)).to.exist;
  });

  it('renders spinner when refreshing documents along with count', function () {
    const container = renderPipelinePaginationCount({
      loading: true,
      count: 20,
    });
    expect(within(container).getByText('of 20')).to.exist;
    expect(within(container).getByTitle(/Refreshing document count/)).to.exist;
  });
});
