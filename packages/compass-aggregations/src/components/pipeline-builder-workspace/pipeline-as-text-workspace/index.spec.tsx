import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../stores/store';

import { PipelineAsTextWorkspace } from '.';

const renderPipelineAsTextWorkspace = (
  props: Partial<ComponentProps<typeof PipelineAsTextWorkspace>> = {}
) => {
  render(
    <Provider store={configureStore({})}>
      <PipelineAsTextWorkspace isAutoPreview={true} {...props} />
    </Provider>
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
