import React from 'react';
import type { ComponentProps } from 'react';
import type { Document } from 'mongodb';
import { screen, cleanup } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';

import {
  renderWithStore,
  wrapWithExperimentProvider,
} from '../../../test/configure-store';
import { ExperimentTestGroups } from '@mongodb-js/compass-telemetry';

import { StagePreview } from './';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../constants';
import type { ConfigureStoreOptions } from '../../stores/store';

const DEFAULT_PIPELINE: Document[] = [{ $match: { _id: 1 } }, { $limit: 10 }];

const renderStagePreview = (
  props: Partial<ComponentProps<typeof StagePreview>> = {},
  pipeline = DEFAULT_PIPELINE,
  storeOptions: Partial<ConfigureStoreOptions> = {},
  {
    enableSearchActivationExperiment = false,
    enableSearchContextualAiAssistantEntryExperiment = false,
  }: {
    enableSearchActivationExperiment?: boolean;
    enableSearchContextualAiAssistantEntryExperiment?: boolean;
  } = {}
) => {
  let ui = (
    <StagePreview
      documents={[]}
      index={Math.max(pipeline.length - 1, 0)}
      isLoading={false}
      isDisabled={false}
      isMissingAtlasOnlyStageSupport={false}
      stageOperator=""
      shouldRenderStage={false}
      showSearchIndexStaleResultsBanner={false}
      searchIndexName={null}
      serverErrorStageIdx={null}
      {...props}
    />
  );
  if (enableSearchActivationExperiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP1Variant
    );
  }
  if (enableSearchContextualAiAssistantEntryExperiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchContextualAiAssistantEntryVariant
    );
  }
  return renderWithStore(ui, { pipeline, ...storeOptions });
};

describe('StagePreview', function () {
  afterEach(cleanup);
  it('renders empty content when stage is disabled', async function () {
    await renderStagePreview({
      isDisabled: true,
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders no preview documents when stage can not be previewed', async function () {
    await renderStagePreview({
      shouldRenderStage: false,
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders atlas preview when operator is $search', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      isMissingAtlasOnlyStageSupport: true,
      stageOperator: '$search',
    });
    expect(screen.getByTestId('atlas-only-stage-preview')).to.exist;
  });
  it('renders out preivew when operator is $out', async function () {
    await renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$out',
        index: 1,
      },
      [{ $match: { _id: 1 } }, { $out: 'test' }]
    );
    expect(screen.getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
  });
  it('renders merge preview when operator is $merge', async function () {
    await renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$merge',
        index: 1,
      },
      [{ $match: { _id: 1 } }, { $merge: 'test' }]
    );
    expect(screen.getByText(MERGE_STAGE_PREVIEW_TEXT)).to.exist;
  });
  it('renders loading preview docs', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      isLoading: true,
      stageOperator: '$match',
    });
    expect(screen.getByText(/Loading Preview Documents.../i)).to.exist;
  });
  it('renders no preview documents when there are no documents', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      documents: [],
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders list of documents', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      documents: [{ _id: 1 }, { _id: 2 }],
    });
    const docs = screen.getAllByTestId('readonly-document');
    expect(docs).to.have.length(2);
  });
  it('renders missing search index text for $search', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$search',
      documents: [],
    });
    expect(screen.getByText('No preview documents')).to.exist;
    expect(
      screen.getByText(
        'This may be because your search has no results or your search index does not exist.'
      )
    ).to.exist;
  });
  it('renders diagnose button for $search with no results when contextual AI experiment is active', async function () {
    await renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$search',
        documents: [],
      },
      DEFAULT_PIPELINE,
      {},
      { enableSearchContextualAiAssistantEntryExperiment: true }
    );
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
    expect(screen.getByTestId('stage-preview-diagnose-search-button')).to.exist;
  });
  it('does not render diagnose button when contextual AI experiment is not active', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$search',
      documents: [],
    });
    expect(screen.queryByTestId('stage-preview-diagnose-search-button')).to.not
      .exist;
  });
  it('does not render diagnose button for $vectorSearch even when contextual AI experiment is active', async function () {
    await renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$vectorSearch',
        documents: [],
      },
      DEFAULT_PIPELINE,
      {},
      { enableSearchContextualAiAssistantEntryExperiment: true }
    );
    expect(screen.queryByTestId('stage-preview-diagnose-search-button')).to.not
      .exist;
  });
  it('renders $search preview docs', async function () {
    await renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$search',
      documents: [{ _id: 1 }, { _id: 2 }],
    });
    const docs = screen.getAllByTestId('readonly-document');
    expect(docs).to.have.length(2);
  });

  describe('search index stale results banner', function () {
    it('should show stale results banner when index is rebuilding but queryable', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          showSearchIndexStaleResultsBanner: true,
          searchIndexName: 'test-index',
        },
        [{ $search: { index: 'test-index' } }],
        {},
        { enableSearchActivationExperiment: true }
      );

      expect(screen.getByTestId('search-index-stale-results-banner')).to.exist;
    });

    it('should show stale results banner for $vectorSearch', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$vectorSearch',
          documents: [{ _id: 1 }],
          showSearchIndexStaleResultsBanner: true,
          searchIndexName: 'vector-index',
        },
        [{ $vectorSearch: { index: 'vector-index' } }],
        {},
        { enableSearchActivationExperiment: true }
      );

      expect(screen.getByTestId('search-index-stale-results-banner')).to.exist;
    });

    it('should NOT show stale results banner when index is ready', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          showSearchIndexStaleResultsBanner: false,
          searchIndexName: 'test-index',
        },
        [{ $search: { index: 'test-index' } }]
      );

      expect(screen.queryByTestId('search-index-stale-results-banner')).to.not
        .exist;
    });

    it('should NOT show stale results banner when index is not queryable', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          showSearchIndexStaleResultsBanner: false,
          searchIndexName: 'test-index',
        },
        [{ $search: { index: 'test-index' } }]
      );

      expect(screen.queryByTestId('search-index-stale-results-banner')).to.not
        .exist;
    });

    it('should NOT show stale results banner when no search index name found', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          showSearchIndexStaleResultsBanner: false,
          searchIndexName: null,
        },
        [{ $search: {} }]
      );

      expect(screen.queryByTestId('search-index-stale-results-banner')).to.not
        .exist;
    });

    it('should NOT show stale results banner for non-search stages', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$match',
          documents: [{ _id: 1 }],
        },
        [{ $match: { _id: 1 } }],
        {},
        { enableSearchActivationExperiment: true }
      );

      expect(screen.queryByTestId('search-index-stale-results-banner')).to.not
        .exist;
    });

    it('should NOT show stale results banner when experiment is not in variant', async function () {
      await renderStagePreview({
        shouldRenderStage: true,
        stageOperator: '$search',
        documents: [{ _id: 1 }],
        showSearchIndexStaleResultsBanner: true,
        searchIndexName: 'test-index',
      });

      expect(screen.queryByTestId('search-index-stale-results-banner')).to.not
        .exist;
    });
  });

  describe('upstream stage error', function () {
    it('should show upstream error with link to errored stage', async function () {
      await renderStagePreview({
        shouldRenderStage: true,
        stageOperator: '$match',
        serverErrorStageIdx: 0,
      });

      expect(screen.getByTestId('stage-preview-upstream-error')).to.exist;
      const link = screen.getByRole('button', { name: 'Stage 1' });
      expect(link).to.exist;
    });

    it('should not show upstream error when serverErrorStageIdx is null', async function () {
      await renderStagePreview({
        shouldRenderStage: true,
        stageOperator: '$match',
        documents: [],
        serverErrorStageIdx: null,
      });

      expect(screen.queryByTestId('stage-preview-upstream-error')).to.not.exist;
    });
  });
});
