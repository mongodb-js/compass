import React from 'react';
import type { ComponentProps } from 'react';
import {
  screen,
  within,
  userEvent,
  cleanup,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import { renderWithStore } from '../../../../test/configure-store';

import { PipelinePreview } from './pipeline-preview';
import HadronDocument from 'hadron-document';
import type { ConfigureStoreOptions } from '../../../stores/store';

const renderPipelineEditor = (
  props: Partial<ComponentProps<typeof PipelinePreview>> = {},
  storeOptions: Partial<ConfigureStoreOptions> = {}
) => {
  return renderWithStore(
    <PipelinePreview
      isPreviewStale={false}
      isMergeStage={false}
      isOutStage={false}
      isLoading={false}
      previewDocs={null}
      isMissingAtlasSupport={false}
      atlasOperator=""
      showSearchIndexStaleResultsBanner={false}
      searchIndexName={null}
      onExpand={() => {}}
      onCollapse={() => {}}
      {...props}
    />,
    storeOptions
  );
};

describe('PipelinePreview', function () {
  afterEach(cleanup);

  it('renders editor workspace', async function () {
    await renderPipelineEditor({});
    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(container).to.exist;
  });

  it('renders header', async function () {
    await renderPipelineEditor({});
    expect(screen.getByText(/Pipeline Output/)).to.exist;
  });

  it('renders text when pipeline is not run yet', async function () {
    await renderPipelineEditor({ previewDocs: null });
    expect(
      screen.getByText(
        /Preview results to see a sample of the aggregated results from this pipeline./
      )
    ).to.exist;
  });

  it('renders text when preview docs are empty', async function () {
    await renderPipelineEditor({ previewDocs: [] });
    expect(screen.getByText(/No preview documents/)).to.exist;
  });

  it('renders missing search index text for $search', async function () {
    await renderPipelineEditor({
      atlasOperator: '$search',
      previewDocs: [],
    });
    expect(screen.getByText('No preview documents')).to.exist;
    expect(
      screen.getByText(
        'This may be because your search has no results or your search index does not exist.'
      )
    ).to.exist;
  });

  it('renders document list', async function () {
    await renderPipelineEditor({
      previewDocs: [{ _id: 1 }, { _id: 2 }].map(
        (doc) => new HadronDocument(doc)
      ),
    });
    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(
      container.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(2);
  });

  it('renders pipeline output menu', async function () {
    const previewDocs = [
      new HadronDocument({
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
      }),
    ];
    await renderPipelineEditor({
      previewDocs,
      onExpand: () => {
        previewDocs[0].expand();
      },
      onCollapse: () => {
        previewDocs[0].collapse();
      },
    });

    const docList = screen.getByTestId('document-list-item');

    // By default we don't expand nested props of a document
    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(() => within(docList).getByText(/number/)).to.throw();
    expect(() => within(docList).getByText(/another/)).to.throw();
    expect(() => within(docList).getByText(/deep/)).to.throw();
    expect(() => within(docList).getByText(/nested/)).to.throw();
    expect(() => within(docList).getByText(/document/)).to.throw();

    // Expand the whole document
    userEvent.click(
      screen.getByRole('button', {
        name: /output options/i,
      })
    );
    userEvent.click(
      screen.getByRole('menuitem', {
        name: /expand all fields/i,
      })
    );

    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(within(docList).getByText(/number/)).to.exist;
    expect(within(docList).getByText(/another/)).to.exist;
    expect(within(docList).getByText(/deep/)).to.exist;
    expect(within(docList).getByText(/nested/)).to.exist;
    expect(within(docList).getByText(/document/)).to.exist;

    // Collapse the whole document
    userEvent.click(
      screen.getByRole('button', {
        name: /output options/i,
      })
    );
    userEvent.click(
      screen.getByRole('menuitem', {
        name: /collapse all fields/i,
      })
    );

    expect(within(docList).getByText(/_id/)).to.exist;
    expect(within(docList).getByText(/score/)).to.exist;
    expect(() => within(docList).getByText(/number/)).to.throw();
    expect(() => within(docList).getByText(/another/)).to.throw();
    expect(() => within(docList).getByText(/deep/)).to.throw();
    expect(() => within(docList).getByText(/nested/)).to.throw();
    expect(() => within(docList).getByText(/document/)).to.throw();
  });

  it('renders output stage preview', async function () {
    await renderPipelineEditor(
      {
        previewDocs: [{ _id: 1 }, { _id: 2 }, { _id: 3 }].map(
          (doc) => new HadronDocument(doc)
        ),
        isOutStage: true,
      },
      {
        pipeline: [{ $limit: 20 }, { $out: 'users' }],
      }
    );

    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(
      container.querySelectorAll('[data-testid="document-list-item"]')
    ).to.have.lengthOf(3);
    expect(within(container).getByTestId('output-stage-preview')).to.exist;
  });

  it('renders atlas stage preview', async function () {
    await renderPipelineEditor({
      isMissingAtlasSupport: true,
      atlasOperator: '$search',
    });
    const container = screen.getByTestId('pipeline-as-text-preview');
    expect(within(container).getByTestId('atlas-only-stage-preview')).to.exist;
  });

  describe('stale preview', function () {
    const staleMessage = /Output outdated and no longer in sync./;
    it('does not render stale banner when preview docs is null', async function () {
      await renderPipelineEditor({ isPreviewStale: true, previewDocs: null });
      expect(screen.queryByText(staleMessage)).to.not.exist;
    });

    it('does not render stale banner when preview docs is empty', async function () {
      await renderPipelineEditor({ isPreviewStale: true, previewDocs: [] });
      expect(screen.queryByText(staleMessage)).to.not.exist;
    });

    it('renders stale banner when preview is stale', async function () {
      await renderPipelineEditor({
        isPreviewStale: true,
        previewDocs: [new HadronDocument({ _id: 1 })],
      });
      expect(screen.getByText(staleMessage)).to.exist;
    });
  });

  describe('search index stale results banner', function () {
    it('should show stale results banner when showSearchIndexStaleResultsBanner is true', async function () {
      await renderPipelineEditor({
        previewDocs: [new HadronDocument({ _id: 1 })],
        showSearchIndexStaleResultsBanner: true,
        searchIndexName: 'test-index',
      });

      expect(
        screen.getByText(
          /Results shown are based on the most recently built index version/i
        )
      ).to.exist;
    });

    it('should NOT show stale results banner when showSearchIndexStaleResultsBanner is false', async function () {
      await renderPipelineEditor({
        previewDocs: [new HadronDocument({ _id: 1 })],
        showSearchIndexStaleResultsBanner: false,
        searchIndexName: 'test-index',
      });

      expect(
        screen.queryByText(
          /Results shown are based on the most recently built index version/i
        )
      ).to.not.exist;
    });

    it('should NOT show stale results banner when there are no documents', async function () {
      await renderPipelineEditor({
        previewDocs: [],
        showSearchIndexStaleResultsBanner: true,
        searchIndexName: 'test-index',
      });

      expect(
        screen.queryByText(
          /Results shown are based on the most recently built index version/i
        )
      ).to.not.exist;
    });

    it('should NOT show stale results banner when previewDocs is null', async function () {
      await renderPipelineEditor({
        previewDocs: null,
        showSearchIndexStaleResultsBanner: true,
        searchIndexName: 'test-index',
      });

      expect(
        screen.queryByText(
          /Results shown are based on the most recently built index version/i
        )
      ).to.not.exist;
    });

    it('should show stale results banner with multiple documents', async function () {
      await renderPipelineEditor({
        previewDocs: [
          new HadronDocument({ _id: 1 }),
          new HadronDocument({ _id: 2 }),
          new HadronDocument({ _id: 3 }),
        ],
        showSearchIndexStaleResultsBanner: true,
        searchIndexName: 'vector-index',
      });

      expect(
        screen.getByText(
          /Results shown are based on the most recently built index version/i
        )
      ).to.exist;
    });
  });
});
