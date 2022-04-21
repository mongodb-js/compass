import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import { PipelinePaginationCount } from './pipeline-pagination-count';

describe('PipelinePagination', function () {
  it('renders count button by default', function () {
    render(
      <PipelinePaginationCount
        loading={false}
        count={undefined}
        onCount={() => {}}
      />
    );

    const container = screen.getByTestId('pipeline-pagination-count');
    expect(within(container).getByTestId('pipeline-pagination-count-action')).to
      .exist;
  });
  it('calls onCount when clicked', function () {
    const onCountSpy = spy();
    render(
      <PipelinePaginationCount
        loading={false}
        count={undefined}
        onCount={onCountSpy}
      />
    );

    expect(onCountSpy.calledOnce).to.be.false;
    const container = screen.getByTestId('pipeline-pagination-count');
    userEvent.click(
      within(container).getByTestId('pipeline-pagination-count-action')
    );
    expect(onCountSpy.calledOnce).to.be.true;
  });
  it('renders count of results', function () {
    render(
      <PipelinePaginationCount loading={false} count={20} onCount={() => {}} />
    );

    const container = screen.getByTestId('pipeline-pagination-count');
    expect(within(container).getByText('of 20')).to.exist;
  });
});
