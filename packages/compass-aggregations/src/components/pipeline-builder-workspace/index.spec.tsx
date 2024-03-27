import React from 'react';
import { Provider } from 'react-redux';
import type { ComponentProps } from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import configureStore from '../../../test/configure-store';
import { PipelineBuilderWorkspace } from '.';
import { toggleSidePanel } from '../../modules/side-panel';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';

const renderBuilderWorkspace = (
  props: Partial<ComponentProps<typeof PipelineBuilderWorkspace>> = {}
) => {
  const store = configureStore();
  render(
    <ConnectionInfoProvider
      value={{
        id: '1234',
        connectionOptions: {
          connectionString: 'mongodb://webscales.com:27017',
        },
      }}
    >
      <Provider store={store}>
        <PipelineBuilderWorkspace pipelineMode="as-text" {...props} />
      </Provider>
    </ConnectionInfoProvider>
  );
  return store;
};

describe('PipelineBuilderWorkspace', function () {
  afterEach(cleanup);

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
    const store = renderBuilderWorkspace({ pipelineMode: 'builder-ui' });
    store.dispatch(toggleSidePanel() as any);
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(() => {
      within(container).getByTestId('aggregation-side-panel');
    }).to.not.throw;
  });

  it('does not render side panel when enabled in as text mode', function () {
    const store = renderBuilderWorkspace({ pipelineMode: 'as-text' });
    store.dispatch(toggleSidePanel() as any);
    const container = screen.getByTestId('pipeline-builder-workspace');
    expect(() => {
      within(container).getByTestId('aggregation-side-panel');
    }).to.throw;
  });
});
