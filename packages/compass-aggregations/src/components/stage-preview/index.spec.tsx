import React from 'react';
import type { ComponentProps } from 'react';
import type { Document } from 'mongodb';
import {
  screen,
  cleanup,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import Sinon from 'sinon';
import HadronDocument from 'hadron-document';
import { AssistantActionsContext } from '@mongodb-js/compass-assistant';

import {
  renderWithStore,
  wrapWithExperimentProvider,
} from '../../../test/configure-store';
import { ExperimentTestGroups } from '@mongodb-js/compass-telemetry';
import {
  createSandboxFromDefaultPreferences,
  type PreferencesAccess,
} from 'compass-preferences-model';

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
    enableSearchActivationP1Experiment = false,
    enableSearchActivationP2Experiment = false,
    preferences,
    interpretAnalyzeOutput,
  }: {
    enableSearchActivationP1Experiment?: boolean;
    enableSearchActivationP2Experiment?: boolean;
    preferences?: PreferencesAccess;
    interpretAnalyzeOutput?: Sinon.SinonSpy;
  } = {}
) => {
  let ui: React.ReactElement = (
    <StagePreview
      documents={[]}
      index={Math.max(pipeline.length - 1, 0)}
      isLoading={false}
      isDisabled={false}
      isMissingAtlasOnlyStageSupport={false}
      stageOperator=""
      stageMetadata={null}
      shouldRenderStage={false}
      showSearchIndexStaleResultsBanner={false}
      searchIndexName={null}
      serverErrorStageIdx={null}
      pipeline={null}
      {...props}
    />
  );
  if (interpretAnalyzeOutput) {
    ui = (
      <AssistantActionsContext.Provider value={{ interpretAnalyzeOutput }}>
        {ui}
      </AssistantActionsContext.Provider>
    );
  }
  if (enableSearchActivationP1Experiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP1Variant
    );
  }
  if (enableSearchActivationP2Experiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP2Variant
    );
  }
  return renderWithStore(
    ui,
    { pipeline, ...storeOptions },
    undefined,
    preferences ? { preferences } : {}
  );
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
        { enableSearchActivationP1Experiment: true }
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
        { enableSearchActivationP1Experiment: true }
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
        { enableSearchActivationP1Experiment: true }
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

  describe('search score chips', function () {
    const searchMetadata = {
      type: '$search' as const,
      scores: [
        { value: 1.5, description: 'sum of:', details: [] },
        { value: 0.8, description: 'sum of:', details: [] },
      ],
    };

    it('renders score chips when stageMetadata has $search scores', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }, { _id: 2 }],
          stageMetadata: searchMetadata,
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true }
      );

      const chips = screen.getAllByTestId('stage-preview-search-score-chip');
      expect(chips).to.have.length(2);
      expect(chips[0].textContent).to.include('1.5');
      expect(chips[1].textContent).to.include('0.8');
    });

    it('does not render score chips when stageMetadata is null', async function () {
      await renderStagePreview({
        shouldRenderStage: true,
        stageOperator: '$search',
        documents: [{ _id: 1 }],
        stageMetadata: null,
      });

      expect(screen.queryByTestId('stage-preview-search-score-chip')).to.not
        .exist;
    });

    it('does not render a chip for null score entries', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }, { _id: 2 }],
          stageMetadata: {
            type: '$search',
            scores: [{ value: 1.5, description: 'sum of:', details: [] }, null],
          },
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true }
      );

      const chips = screen.getAllByTestId('stage-preview-search-score-chip');
      expect(chips).to.have.length(1);
      expect(chips[0].textContent).to.include('1.5');
    });

    it('does not render score chips when not in the P2 experiment variant', async function () {
      await renderStagePreview({
        shouldRenderStage: true,
        stageOperator: '$search',
        documents: [{ _id: 1 }, { _id: 2 }],
        stageMetadata: searchMetadata,
      });

      expect(screen.queryByTestId('stage-preview-search-score-chip')).to.not
        .exist;
    });
  });

  describe('analyze output button', function () {
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableAIAssistant: true,
        enableGenAIFeatures: true,
        enableGenAIFeaturesAtlasOrg: true,
        cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
      });
    });

    it('renders the button for $search stage with documents and score metadata when P2 experiment is enabled', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          stageMetadata: {
            type: '$search',
            scores: [{ value: 1.5, description: 'sum of:', details: [] }],
          },
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true, preferences }
      );
      expect(screen.getByTestId('analyze-search-output-button')).to.exist;
    });

    it('does not render the button when score metadata is absent', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
          stageMetadata: null,
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true, preferences }
      );
      expect(screen.queryByTestId('analyze-search-output-button')).to.not.exist;
    });

    it('does not render the button for non-$search stages', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$match',
          documents: [{ _id: 1 }],
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true, preferences }
      );
      expect(screen.queryByTestId('analyze-search-output-button')).to.not.exist;
    });

    it('does not render the button when there are no documents', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [],
        },
        DEFAULT_PIPELINE,
        {},
        { enableSearchActivationP2Experiment: true, preferences }
      );
      expect(screen.queryByTestId('analyze-search-output-button')).to.not.exist;
    });

    it('does not render the button when P2 experiment is not enabled', async function () {
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [{ _id: 1 }],
        },
        DEFAULT_PIPELINE,
        {},
        { preferences }
      );
      expect(screen.queryByTestId('analyze-search-output-button')).to.not.exist;
    });

    it('calls interpretAnalyzeOutput with the correct args when clicked', async function () {
      const interpretAnalyzeOutputSpy = Sinon.spy();
      const doc = new HadronDocument({ _id: 1, title: 'Espresso Basics' });
      const score = { value: 1.5, description: 'sum of:', details: [] };
      const pipeline =
        '[{ $search: { index: "default", text: { query: "espresso", path: "title" } } }]';
      await renderStagePreview(
        {
          shouldRenderStage: true,
          stageOperator: '$search',
          documents: [doc],
          stageMetadata: { type: '$search', scores: [score] },
          pipeline,
        },
        DEFAULT_PIPELINE,
        {},
        {
          enableSearchActivationP2Experiment: true,
          preferences,
          interpretAnalyzeOutput: interpretAnalyzeOutputSpy,
        }
      );

      userEvent.click(screen.getByTestId('analyze-search-output-button'));

      expect(interpretAnalyzeOutputSpy).to.have.been.calledOnce;
      const args = interpretAnalyzeOutputSpy.firstCall.args[0];
      expect(args).to.have.property('pipeline', pipeline);
      expect(args).to.have.property('documentCount', 1);
      expect(args.output).to.include('Document 1:');
      expect(args.output).to.include('"_id":1');
      expect(args.output).to.include('"title":"Espresso Basics"');
      expect(args.output).to.include(`scoreDetails: ${JSON.stringify(score)}`);
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
