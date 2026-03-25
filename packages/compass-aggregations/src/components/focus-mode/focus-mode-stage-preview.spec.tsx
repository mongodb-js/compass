import React, { type ComponentProps } from 'react';
import HadronDocument from 'hadron-document';
import type { Document } from 'mongodb';
import { screen, within } from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import {
  FocusModePreview,
  InputPreview,
  OutputPreview,
} from './focus-mode-stage-preview';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../constants';

import { renderWithStore } from '../../../test/configure-store';
import type { ConfigureStoreOptions } from '../../stores/store';

const DEFAULT_PIPELINE: Document[] = [{ $match: { _id: 1 } }, { $limit: 10 }];

const renderFocusModePreview = (
  props: Partial<ComponentProps<typeof FocusModePreview>> = {},
  pipeline = DEFAULT_PIPELINE,
  storeOptions: Partial<ConfigureStoreOptions> = {},
  services: any = {}
) => {
  return renderWithStore(
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
    />,
    { pipeline, ...storeOptions },
    undefined,
    services
  );
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
          {
            preferences: {
              getPreferences() {
                return { enableSearchActivationProgramP1: true };
              },
            },
          }
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
          {
            preferences: {
              getPreferences() {
                return { enableSearchActivationProgramP1: true };
              },
            },
          }
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
          {
            preferences: {
              getPreferences() {
                return { enableSearchActivationProgramP1: true };
              },
            },
          }
        );

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });

      it('should NOT show stale results banner when feature flag is disabled', async function () {
        await renderFocusModePreview(
          {
            stageOperator: '$search',
            documents: [new HadronDocument({ _id: 1 })],
            showSearchIndexStaleResultsBanner: true,
            searchIndexName: 'test-index',
          },
          [],
          {},
          {
            preferences: {
              getPreferences() {
                return { enableSearchActivationProgramP1: false };
              },
            },
          }
        );

        expect(
          screen.queryByTestId('search-index-stale-results-banner')
        ).to.not.exist;
      });
    });
  });
});
