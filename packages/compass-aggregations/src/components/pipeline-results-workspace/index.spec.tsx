import HadronDocument from 'hadron-document';
import type { ComponentProps } from 'react';
import React from 'react';
import { screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { spy } from 'sinon';
import userEvent from '@testing-library/user-event';
import { renderWithStore } from '../../../test/configure-store';
import { PipelineResultsWorkspace } from './index';

const renderPipelineResultsWorkspace = (
  props: Partial<ComponentProps<typeof PipelineResultsWorkspace>> = {}
) => {
  return renderWithStore(
    <PipelineResultsWorkspace
      namespace="test.test"
      documents={[]}
      isLoading={false}
      isError={false}
      isEmpty={false}
      isMergeOrOutPipeline={false}
      onRetry={() => {}}
      onCancel={() => {}}
      resultsViewType={'document'}
      {...props}
    />
  );
};

describe('PipelineResultsWorkspace', function () {
  it('renders loading state', async function () {
    await renderPipelineResultsWorkspace({ isLoading: true });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    expect(within(container).getByTestId('pipeline-results-loader')).to.exist;
  });

  it('renders empty results state', async function () {
    await renderPipelineResultsWorkspace({ isEmpty: true });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    expect(within(container).getByTestId('pipeline-empty-results')).to.exist;
  });

  it('renders documents', async function () {
    await renderPipelineResultsWorkspace({
      documents: [
        new HadronDocument({ id: '1' }),
        new HadronDocument({ id: '2' }),
      ],
    });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(
      container.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(2);
  });

  it('calls cancel when user stop aggregation', async function () {
    const onCancelSpy = spy();
    await renderPipelineResultsWorkspace({
      isLoading: true,
      onCancel: onCancelSpy,
    });
    const container = screen.getByTestId('pipeline-results-workspace');
    expect(container).to.exist;
    userEvent.click(within(container).getByText('Stop'), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onCancelSpy.calledOnce).to.be.true;
  });

  it('should render error banner', async function () {
    const onRetry = spy();
    await renderPipelineResultsWorkspace({
      isError: true,
      error: 'Something bad happened',
      onRetry,
    });
    expect(screen.getByText('Something bad happened')).to.exist;
    userEvent.click(screen.getByText('Retry'), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onRetry).to.be.calledOnce;
  });

  it('should render $out / $merge result screen', async function () {
    const onOutClick = spy();
    await renderPipelineResultsWorkspace({
      isMergeOrOutPipeline: true,
      mergeOrOutDestination: 'foo.bar',
      onOutClick,
    });
    expect(screen.getByText('Results persisted in foo.bar namespace')).to.exist;
    userEvent.click(screen.getByText('Go to collection'), undefined, {
      skipPointerEventsCheck: true,
    });
    expect(onOutClick).to.be.calledOnce;
  });
});
