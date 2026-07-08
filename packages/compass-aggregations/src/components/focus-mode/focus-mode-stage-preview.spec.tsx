import React, { type ComponentProps } from 'react';
import HadronDocument from 'hadron-document';
import type { Document } from 'mongodb';
import { screen, within, userEvent } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import Sinon from 'sinon';
import {
  FocusModePreview,
  InputPreview,
  OutputPreview,
} from './focus-mode-stage-preview';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../constants';
import { AssistantActionsContext } from '@mongodb-js/compass-assistant';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';

import {
  renderWithStore,
  wrapWithExperimentProvider,
} from '../../../test/configure-store';
import { ExperimentTestGroups } from '@mongodb-js/compass-telemetry';
import type { ConfigureStoreOptions } from '../../stores/store';

const DEFAULT_PIPELINE: Document[] = [{ $match: { _id: 1 } }, { $limit: 10 }];

const AI_ASSISTANT_PREFERENCES = {
  enableAIAssistant: true,
  enableGenAIFeatures: true,
  enableGenAIFeaturesAtlasOrg: true,
  cloudFeatureRolloutAccess: { GEN_AI_COMPASS: true },
};

const renderOutputPreview = async (
  props: Partial<ComponentProps<typeof OutputPreview>> = {},
  {
    enableSearchActivationP2Experiment = false,
    enableAIAssistant = false,
    diagnoseSearchStage,
  }: {
    enableSearchActivationP2Experiment?: boolean;
    enableAIAssistant?: boolean;
    diagnoseSearchStage?: Sinon.SinonSpy;
  } = {}
) => {
  let ui: React.ReactElement = (
    <OutputPreview
      stageIndex={0}
      stageOperator="$search"
      documents={[]}
      onExpand={() => {}}
      onCollapse={() => {}}
      {...props}
    />
  );
  if (enableAIAssistant) {
    const preferences = await createSandboxFromDefaultPreferences();
    await preferences.savePreferences(AI_ASSISTANT_PREFERENCES);
    ui = <PreferencesProvider value={preferences}>{ui}</PreferencesProvider>;
  }
  if (diagnoseSearchStage) {
    ui = (
      <AssistantActionsContext.Provider value={{ diagnoseSearchStage }}>
        {ui}
      </AssistantActionsContext.Provider>
    );
  }
  if (enableSearchActivationP2Experiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP2Variant
    );
  }
  return renderWithStore(ui, { pipeline: DEFAULT_PIPELINE });
};

const renderFocusModePreview = (
  props: Partial<ComponentProps<typeof FocusModePreview>> = {},
  pipeline = DEFAULT_PIPELINE,
  storeOptions: Partial<ConfigureStoreOptions> = {},
  {
    enableSearchActivationExperiment = false,
  }: { enableSearchActivationExperiment?: boolean } = {}
) => {
  let ui = (
    <FocusModePreview
      title=""
      isLoading={false}
      stageIndex={-1}
      stageOperator={null}
      documents={null}
      isMissingAtlasOnlyStageSupport={false}
      onExpand={() => {}}
      onCollapse={() => {}}
      {...props}
    />
  );
  if (enableSearchActivationExperiment) {
    ui = wrapWithExperimentProvider(
      ui,
      ExperimentTestGroups.searchActivationProgramP1Variant
    );
  }
  return renderWithStore(ui, { pipeline, ...storeOptions });
};

describe('FocusModeStagePreview', function () {
  it('renders stage input', async function () {
    await renderWithStore(
      <InputPreview onExpand={() => {}} onCollapse={() => {}} />
    );
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage input/i)).to.exist;
  });

  it('renders stage output', async function () {
    await renderWithStore(
      <OutputPreview onExpand={() => {}} onCollapse={() => {}} />
    );
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage output/i)).to.exist;
  });

  context('FocusModePreview', function () {
    it('renders loader', async function () {
      await renderFocusModePreview({
        isLoading: true,
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(preview).to.exist;
      expect(within(preview).getByTitle(/loading/i)).to.exist;
    });
    it('renders list of documents', async function () {
      await renderFocusModePreview({
        isLoading: false,
        documents: [
          new HadronDocument({ _id: 12345 }),
          new HadronDocument({ _id: 54321 }),
        ],
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/12345/i)).to.exist;
      expect(within(preview).getByText(/54321/i)).to.exist;
    });
    it('renders no preview documents when its not loading and documents are empty', async function () {
      await renderFocusModePreview({
        documents: [],
        isLoading: false,
      });

      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/no preview documents/i)).to.exist;
    });
    for (const stageOperator of ['$search', '$searchMeta', '$vectorSearch']) {
      it(`renders missing search index text for ${stageOperator}`, async function () {
        await renderFocusModePreview({
          stageOperator,
          documents: [],
        });
        expect(screen.getByText('No preview documents')).to.exist;
        expect(
          screen.getByText(
            'This may be because your search has no results or your search index does not exist.'
          )
        ).to.exist;
      });

      it(`does not render missing search index text for ${stageOperator} and documents.length > 0`, async function () {
        await renderFocusModePreview({
          stageOperator,
          documents: [
            new HadronDocument({ _id: 12345 }),
            new HadronDocument({ _id: 54321 }),
          ],
        });
        expect(screen.queryByText('No preview documents')).to.not.exist;
        expect(
          screen.queryByText(
            'This may be because your search has no results or your search index does not exist.'
          )
        ).to.not.exist;
      });
    }
    it('renders the empty-state action (e.g. the diagnose button) when there are no documents', async function () {
      await renderFocusModePreview({
        stageOperator: '$match',
        documents: [],
        emptyStateAction: <div data-testid="empty-state-action" />,
      });
      expect(screen.getByTestId('empty-state-action')).to.exist;
    });
    it('does not render the empty-state action when there are documents', async function () {
      await renderFocusModePreview({
        stageOperator: '$match',
        documents: [new HadronDocument({ _id: 1 })],
        emptyStateAction: <div data-testid="empty-state-action" />,
      });
      expect(screen.queryByTestId('empty-state-action')).to.not.exist;
    });
    it('renders $out stage preview', async function () {
      await renderFocusModePreview(
        {
          stageOperator: '$out',
          stageIndex: 1,
        },
        [{ $match: { _id: 1 } }, { $out: { into: 'somewhere-out' } }]
      );
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
    });
    it('renders $merge stage preview', async function () {
      await renderFocusModePreview(
        {
          stageOperator: '$merge',
          stageIndex: 1,
        },
        [{ $match: { _id: 1 } }, { $merge: { into: 'somewhere-merge' } }]
      );
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(MERGE_STAGE_PREVIEW_TEXT)).to.exist;
    });
    it('renders atlas stage preview', async function () {
      await renderFocusModePreview({
        stageOperator: '$search',
        stageIndex: 2,
        isMissingAtlasOnlyStageSupport: true,
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByTestId('atlas-only-stage-preview')).to.exist;
    });

    describe('search index stale results banner', function () {
      it('should show stale results banner when showSearchIndexStaleResultsBanner is true', async function () {
        await renderFocusModePreview(
          {
            stageOperator: '$search',
            documents: [
              new HadronDocument({ _id: 12345 }),
              new HadronDocument({ _id: 54321 }),
            ],
            showSearchIndexStaleResultsBanner: true,
            searchIndexName: 'test-index',
          },
          [],
          {},
          { enableSearchActivationExperiment: true }
        );

        expect(
          screen.getByTestId('search-index-stale-results-banner')
        ).to.exist;
      });

      it('should show stale results banner for $vectorSearch', async function () {
        await renderFocusModePreview(
          {
            stageOperator: '$vectorSearch',
            documents: [new HadronDocument({ _id: 1 })],
            showSearchIndexStaleResultsBanner: true,
            searchIndexName: 'vector-index',
          },
          [],
          {},
          { enableSearchActivationExperiment: true }
        );

        expect(
          screen.getByTestId('search-index-stale-results-banner')
        ).to.exist;
      });

      it('should NOT show stale results banner when showSearchIndexStaleResultsBanner is false', async function () {
        await renderFocusModePreview({
          stageOperator: '$search',
          documents: [new HadronDocument({ _id: 1 })],
          showSearchIndexStaleResultsBanner: false,
          searchIndexName: 'test-index',
        });

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });

      it('should NOT show stale results banner when there are no documents', async function () {
        await renderFocusModePreview({
          stageOperator: '$search',
          documents: [],
          showSearchIndexStaleResultsBanner: true,
          searchIndexName: 'test-index',
        });

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });

      it('should NOT show stale results banner for non-search stages', async function () {
        await renderFocusModePreview(
          {
            stageOperator: '$match',
            documents: [new HadronDocument({ _id: 1 })],
            showSearchIndexStaleResultsBanner: false,
            searchIndexName: null,
          },
          [],
          {},
          { enableSearchActivationExperiment: true }
        );

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });

      it('should NOT show stale results banner when experiment is not in variant', async function () {
        await renderFocusModePreview({
          stageOperator: '$search',
          documents: [new HadronDocument({ _id: 1 })],
          showSearchIndexStaleResultsBanner: true,
          searchIndexName: 'test-index',
        });

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });
    });
  });

  describe('OutputPreview diagnose button', function () {
    it('renders the diagnose button for a no-results $search stage under P2 with the assistant enabled', async function () {
      await renderOutputPreview(
        { stageOperator: '$search', documents: [] },
        { enableSearchActivationP2Experiment: true, enableAIAssistant: true }
      );
      expect(screen.getByTestId('focus-mode-diagnose-search-button')).to.exist;
    });

    it('does not render the diagnose button when the assistant is disabled and keeps SearchNoResults', async function () {
      await renderOutputPreview(
        { stageOperator: '$search', documents: [] },
        { enableSearchActivationP2Experiment: true }
      );
      expect(screen.queryByTestId('focus-mode-diagnose-search-button')).to.not
        .exist;
      expect(
        screen.getByText(
          'This may be because your search has no results or your search index does not exist.'
        )
      ).to.exist;
    });

    it('closes focus mode and calls diagnoseSearchStage with the stage context on click', async function () {
      const diagnoseSearchStage = Sinon.spy();
      const onCloseFocusMode = Sinon.spy();
      await renderOutputPreview(
        {
          stageOperator: '$search',
          documents: [],
          stageValue: '{ "index": "movies" }',
          searchIndexName: 'movies',
          onCloseFocusMode,
        },
        {
          enableSearchActivationP2Experiment: true,
          enableAIAssistant: true,
          diagnoseSearchStage,
        }
      );
      userEvent.click(screen.getByTestId('focus-mode-diagnose-search-button'));
      expect(onCloseFocusMode).to.have.been.calledOnce;
      expect(diagnoseSearchStage).to.have.been.calledOnceWith({
        stageOperator: '$search',
        indexName: 'movies',
        stageValue: '{ "index": "movies" }',
      });
    });
  });
});
