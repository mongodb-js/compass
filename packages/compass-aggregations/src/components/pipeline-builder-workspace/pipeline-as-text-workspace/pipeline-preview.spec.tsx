import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../stores/store';

import { PipelinePreview } from './pipeline-preview';

const renderPipelineEditor = (
  props: Partial<ComponentProps<typeof PipelinePreview>> = {},
  storeOptions: any = {}
) => {
  render(
    <Provider store={configureStore(storeOptions)}>
      <PipelinePreview
        isMergeStage={false}
        isOutStage={false}
        isLoading={false}
        previewDocs={null}
        {...props}
      />
    </Provider>
  );
};

describe('PipelinePreview', function () {
  it('renders editor workspace', function () {
    renderPipelineEditor({});
    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(container).to.exist;
  });

  it('renders header', function () {
    renderPipelineEditor({});
    expect(screen.getByText(/Pipeline Output/)).to.exist;
  });

  it('renders text when pipeline is not run yet', function () {
    renderPipelineEditor({ previewDocs: null });
    expect(
      screen.getByText(
        /Preview results to see a sample of the aggregated results from this pipeline./
      )
    ).to.exist;
  });

  it('renders text when preview docs are empty', function () {
    renderPipelineEditor({ previewDocs: [] });
    expect(screen.getByText(/No preview documents/)).to.exist;
  });

  it('renders document list', function () {
    renderPipelineEditor({ previewDocs: [{ _id: 1 }, { _id: 2 }] });
    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(
      container.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(2);
  });

  it('renders output stage preview', function () {
    renderPipelineEditor(
      {
        previewDocs: [{ _id: 1 }, { _id: 2 }, { _id: 3 }],
        isOutStage: true,
      },
      {
        sourcePipeline: `[{$limit: 20}, {$out: "users"}]`,
      }
    );

    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(
      container.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(3);
    expect(within(container).getByTestId('output-stage-preview')).to.exist;
  });
});
