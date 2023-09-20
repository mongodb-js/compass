import React from 'react';
import type { ComponentProps } from 'react';
import type { Document } from 'mongodb';
import { render, screen, cleanup } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../../test/configure-store';

import { StagePreview } from './';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../constants';

const DEFAULT_PIPELINE: Document[] = [{ $match: { _id: 1 } }, { $limit: 10 }];

const renderStagePreview = (
  props: Partial<ComponentProps<typeof StagePreview>> = {},
  pipeline = DEFAULT_PIPELINE
) => {
  render(
    <Provider
      store={configureStore({
        pipeline,
      })}
    >
      <StagePreview
        documents={[]}
        index={1}
        isLoading={false}
        isDisabled={false}
        isMissingAtlasOnlyStageSupport={false}
        stageOperator=""
        shouldRenderStage={false}
        {...props}
      />
    </Provider>
  );
};

describe('StagePreview', function () {
  afterEach(cleanup);
  it('renders empty content when stage is disabled', function () {
    renderStagePreview({
      isDisabled: true,
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders no preview documents when stage can not be previewed', function () {
    renderStagePreview({
      shouldRenderStage: false,
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders atlas preview when operator is $search', function () {
    renderStagePreview({
      shouldRenderStage: true,
      isMissingAtlasOnlyStageSupport: true,
      stageOperator: '$search',
    });
    expect(screen.getByTestId('atlas-only-stage-preview')).to.exist;
  });
  it('renders out preivew when operator is $out', function () {
    renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$out',
        index: 1,
      },
      [{ $match: { _id: 1 } }, { $out: 'test' }]
    );
    expect(screen.getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
  });
  it('renders merge preview when operator is $merge', function () {
    renderStagePreview(
      {
        shouldRenderStage: true,
        stageOperator: '$merge',
        index: 1,
      },
      [{ $match: { _id: 1 } }, { $merge: 'test' }]
    );
    expect(screen.getByText(MERGE_STAGE_PREVIEW_TEXT)).to.exist;
  });
  it('renders loading preview docs', function () {
    renderStagePreview({
      shouldRenderStage: true,
      isLoading: true,
      stageOperator: '$match',
    });
    expect(screen.getByText(/Loading Preview Documents.../i)).to.exist;
  });
  it('renders no preview documents when there are no documents', function () {
    renderStagePreview({
      shouldRenderStage: true,
      documents: [],
    });
    expect(screen.getByTestId('stage-preview-empty')).to.exist;
  });
  it('renders list of documents', function () {
    renderStagePreview({
      shouldRenderStage: true,
      documents: [{ _id: 1 }, { _id: 2 }],
    });
    const docs = screen.getAllByTestId('readonly-document');
    expect(docs).to.have.length(2);
  });
  it('renders missing search index text for $search', function () {
    renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$search',
      documents: [],
    });
    expect(screen.getByText('No results found')).to.exist;
    expect(
      screen.getByText(
        'This may be because your search has no results or your search index does not exist.'
      )
    ).to.exist;
  });
  it('renders $search preview docs', function () {
    renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$search',
      documents: [{ _id: 1 }, { _id: 2 }],
    });
    const docs = screen.getAllByTestId('readonly-document');
    expect(docs).to.have.length(2);
  });
});
