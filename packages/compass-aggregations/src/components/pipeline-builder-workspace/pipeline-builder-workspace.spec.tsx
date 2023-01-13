import React from 'react';
import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from '../../stores/store';
import { PipelineBuilderWorkspace } from './pipeline-builder-workspace';

const renderBuilderWorkspace = (
  props: Partial<ComponentProps<typeof PipelineBuilderWorkspace>> = {}
) => {
  return render(
    <Provider store={configureStore({})}>
      <PipelineBuilderWorkspace pipelineMode="as-text" {...props} />
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
});
