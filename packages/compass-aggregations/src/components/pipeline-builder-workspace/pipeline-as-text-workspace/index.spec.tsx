import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../../test/configure-store';

import { PipelineAsTextWorkspace } from '.';
import { ConnectionInfoProvider } from '@mongodb-js/connection-storage/provider';

const renderPipelineAsTextWorkspace = (
  props: Partial<ComponentProps<typeof PipelineAsTextWorkspace>> = {}
) => {
  render(
    <ConnectionInfoProvider
      value={{
        id: '1234',
        connectionOptions: {
          connectionString: 'mongodb://webscales.com:27017',
        },
      }}
    >
      <Provider store={configureStore()}>
        <PipelineAsTextWorkspace isAutoPreview={true} {...props} />
      </Provider>
    </ConnectionInfoProvider>
  );
};

describe('PipelineAsTextWorkspace', function () {
  it('renders text workspace', function () {
    renderPipelineAsTextWorkspace({});
    const container = screen.getByTestId('pipeline-as-text-workspace');
    expect(container).to.exist;
  });

  it('does not render preview panel when disabled', function () {
    renderPipelineAsTextWorkspace({ isAutoPreview: false });
    expect(() => {
      screen.getByTestId('pipeline-as-text-preview');
    }).to.throw;
  });
});
