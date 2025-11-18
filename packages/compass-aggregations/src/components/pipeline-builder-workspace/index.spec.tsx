import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, screen, within } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { renderWithStore } from '../../../test/configure-store';
import { PipelineBuilderWorkspace } from '.';
import { toggleSidePanel } from '../../modules/side-panel';

const renderBuilderWorkspace = async (
  props: Partial<ComponentProps<typeof PipelineBuilderWorkspace>> = {}
) => {
  const result = await renderWithStore(
    <PipelineBuilderWorkspace pipelineMode="as-text" {...props} />
  );
  return result.plugin.store;
};

describe('PipelineBuilderWorkspace', function () {
  afterEach(cleanup);

  it('renders builder ui workspace', async function () {
    await renderBuilderWorkspace({ pipelineMode: 'builder-ui' });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(within(container).getByTestId('pipeline-builder-ui-workspace')).to
      .exist;
  });

  it('renders as text workspace', async function () {
    await renderBuilderWorkspace({ pipelineMode: 'as-text' });
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(within(container).getByTestId('pipeline-as-text-workspace')).to
      .exist;
  });

  it('renders side panel when enabled in builder ui mode', async function () {
    const store = await renderBuilderWorkspace({ pipelineMode: 'builder-ui' });
    store.dispatch(toggleSidePanel() as any);
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(() => {
      within(container).getByTestId('aggregation-side-panel');
    }).to.not.throw();
  });

  it('does not render side panel when enabled in as text mode', async function () {
    const store = await renderBuilderWorkspace({ pipelineMode: 'as-text' });
    store.dispatch(toggleSidePanel() as any);
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(() => {
      within(container).getByTestId('aggregation-side-panel');
    }).to.throw();
  });
});
