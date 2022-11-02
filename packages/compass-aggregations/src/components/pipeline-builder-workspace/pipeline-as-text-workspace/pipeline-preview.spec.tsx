import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

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

  it('renders pipeline output menu', function () {
    const previewDocs = [
      {
        _id: 1,
        score: [
          { number: 1 },
          {
            another: {
              deep: {
                nested: {
                  document: '1',
                },
              },
            },
          },
        ],
      },
    ];
    renderPipelineEditor({ previewDocs });

    const docList = screen.getByTestId('document-list-item');

    // By default we don't expand nested props of a document
    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(() => within(docList).getByText(/number/)).to.throw;
    expect(() => within(docList).getByText(/another/)).to.throw;
    expect(() => within(docList).getByText(/deep/)).to.throw;
    expect(() => within(docList).getByText(/nested/)).to.throw;
    expect(() => within(docList).getByText(/document/)).to.throw;

    // Expand the whole document
    userEvent.click(screen.getByLabelText('Output Options'));
    userEvent.click(screen.getByLabelText('Expand all fields'));

    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(within(docList).getByText(/number/)).to.exist;
    expect(within(docList).getByText(/another/)).to.exist;
    expect(within(docList).getByText(/deep/)).to.exist;
    expect(within(docList).getByText(/nested/)).to.exist;
    expect(within(docList).getByText(/document/)).to.exist;

    // Collapse the whole document
    userEvent.click(screen.getByLabelText('Output Options'));
    userEvent.click(screen.getByLabelText('Collapse all fields'));

    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(() => within(docList).getByText(/number/)).to.throw;
    expect(() => within(docList).getByText(/another/)).to.throw;
    expect(() => within(docList).getByText(/deep/)).to.throw;
    expect(() => within(docList).getByText(/nested/)).to.throw;
    expect(() => within(docList).getByText(/document/)).to.throw;
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
