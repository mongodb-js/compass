import React from 'react';
import type { ComponentProps } from 'react';
import { screen } from '@testing-library/react';
import { expect } from 'chai';

import { renderWithStore } from '../../../../test/configure-store';

import { PipelineAsTextWorkspace } from '.';

const renderPipelineAsTextWorkspace = (
  props: Partial<ComponentProps<typeof PipelineAsTextWorkspace>> = {}
) => {
  return renderWithStore(
    <PipelineAsTextWorkspace isAutoPreview={true} {...props} />
  );
};

describe('PipelineAsTextWorkspace', function () {
  it('renders text workspace', async function () {
    await renderPipelineAsTextWorkspace();
    const container = screen.getByTestId('pipeline-as-text-workspace');
    expect(container).to.exist;
  });

  it('does not render preview panel when disabled', async function () {
    await renderPipelineAsTextWorkspace({ isAutoPreview: false });
    expect(() => {
      screen.getByTestId('pipeline-as-text-preview');
    }).to.throw;
  });
});
