import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import { PipelineResultsLoader } from './pipeline-results-loader';

describe('PipelineResultsLoader', function () {
  it('renders loading', function () {
    render(<PipelineResultsLoader onCancel={() => {}} />);
    const container = screen.getByTestId('pipeline-results-loader');
    expect(container).to.exist;
    expect(within(container).getByText('Running aggregation')).to.exist;
    expect(within(container).getByTestId('pipeline-results-cancel-action')).to
      .exist;
  });

  it('cancels loading', function () {
    const onCancelSpy = spy();
    render(<PipelineResultsLoader onCancel={onCancelSpy} />);
    userEvent.click(screen.getByTestId('pipeline-results-cancel-action'));

    expect(onCancelSpy.calledOnce).to.be.true;
  });
});
