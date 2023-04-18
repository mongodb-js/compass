import React from 'react';
import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from '../../../test/configure-store';
import { PipelineBuilderWorkspace } from '.';

const renderBuilderWorkspace = (
  props: Partial<ComponentProps<typeof PipelineBuilderWorkspace>> = {}
) => {
  return render(
    <Provider store={configureStore()}>
      <PipelineBuilderWorkspace
        isPanelOpen={false}
        pipelineMode="as-text"
        {...props}
      />
    </Provider>
  );
};

describe('PipelineBuilderWorkspace', function () {
  it('renders builder ui workspace', function () {
    renderBuilderWorkspace({ pipelineMode: 'builder-ui' });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(within(container).getByTestId('pipeline-builder-ui-workspace')).to
      .exist;
  });

  it('renders as text workspace', function () {
    renderBuilderWorkspace({ pipelineMode: 'as-text' });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(within(container).getByTestId('pipeline-as-text-workspace')).to
      .exist;
  });

  it('renders side panel when enabled in builder ui mode', function () {
    renderBuilderWorkspace({ pipelineMode: 'builder-ui', isPanelOpen: true });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(within(container).getByTestId('aggregation-side-panel')).to.exist;
  });

  it('does not render side panel when enabled in as text mode', function () {
    renderBuilderWorkspace({ pipelineMode: 'as-text', isPanelOpen: true });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(() => {
      within(container).getByTestId('aggregation-side-panel');
    }).to.throw;
  });
});
