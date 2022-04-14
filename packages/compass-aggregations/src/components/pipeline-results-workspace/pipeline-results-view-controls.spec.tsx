import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';

import PipelineResultsViewControls from './pipeline-results-view-controls';

describe('PipelineResultsViewControls', function () {
  it('renders correctly', function () {
    render(
      <PipelineResultsViewControls value="document" onChange={() => {}} />
    );
    const container = screen.getByTestId('pipeline-results-view-controls');
    expect(container).to.exist;
    expect(within(container).getByText('View')).to.exist;
    expect(within(container).getByLabelText('Document list')).to.exist;
    expect(within(container).getByLabelText('JSON list')).to.exist;
  });

  it('calls onChange', function () {
    const onChangeSpy = spy();
    render(
      <PipelineResultsViewControls value="document" onChange={onChangeSpy} />
    );
    const container = screen.getByTestId('pipeline-results-view-controls');
    userEvent.click(
      within(container).getByRole('tab', { name: /curly braces icon/i })
    );
    userEvent.click(within(container).getByRole('tab', { name: /menu icon/i }));

    expect(onChangeSpy.calledTwice).to.be.true;
    expect(onChangeSpy.firstCall.args).to.deep.equal(['json']);
    expect(onChangeSpy.secondCall.args).to.deep.equal(['document']);
  });
});
