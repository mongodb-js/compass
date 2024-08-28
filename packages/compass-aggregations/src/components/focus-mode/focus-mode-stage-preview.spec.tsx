import React, { type ComponentProps } from 'react';
import HadronDocument from 'hadron-document';
import type { Document } from 'mongodb';
import { screen, within } from '@testing-library/react';
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

const DEFAULT_PIPELINE: Document[] = [{ $match: { _id: 1 } }, { $limit: 10 }];

const renderFocusModePreview = (
  props: Partial<ComponentProps<typeof FocusModePreview>> = {},
  pipeline = DEFAULT_PIPELINE
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
    { pipeline }
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
  });
});
