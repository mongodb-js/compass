import React from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';

import { PipelineResultsWorkspace } from './index';

const renderPipelineResultsWorkspace = (props: Record<string, any> = {}) => {
  render(
    <Provider store={configureStore()}>
      <PipelineResultsWorkspace
        documents={[]}
        loading={false}
        hasEmptyResults={false}
        onCancel={() => {}}
        {...props}
      />
    </Provider>
  );
};

describe('PipelineResultsWorkspace', function () {
  it('renders correctly', function () {
    renderPipelineResultsWorkspace();
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
  });
  it('renders loading state', function () {
    renderPipelineResultsWorkspace({ loading: true });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    expect(within(container).getByTestId('pipeline-results-loader')).to.exist;
  });
  it('renders error state', function () {
    renderPipelineResultsWorkspace({ error: 'Some error happened' });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    expect(within(container).getByText('Some error happened')).to.exist;
  });
  it('renders empty results state', function () {
    renderPipelineResultsWorkspace({ hasEmptyResults: true });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    expect(within(container).getByText('No results to show')).to.exist;
  });
  it('renders documents', function () {
    renderPipelineResultsWorkspace({ documents: [{ id: '1' }, { id: '2' }] });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(
      container.querySelectorAll('[data-test-id="document-list-item"]')
    ).to.have.lengthOf(2);
  });
  it('calls cancel when user stop aggregation', function () {
    const onCancelSpy = spy();
    renderPipelineResultsWorkspace({ loading: true, onCancel: onCancelSpy });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    userEvent.click(within(container).getByText('Stop'), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onCancelSpy.calledOnce).to.be.true;
  });
});
