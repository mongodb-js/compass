import React from 'react';
import type { ComponentProps } from 'react';
import { render, screen } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';

import configureStore from '../../stores/store';

import { StagePreview } from './';
import {
  MERGE_STAGE_PREVIEW_TEXT,
  OUT_STAGE_PREVIEW_TEXT,
} from '../../utils/stage';

const renderStagePreview = (
  props: Partial<ComponentProps<typeof StagePreview>> = {}
) => {
  render(
    <Provider
      store={configureStore({
        sourcePipeline: [{ $match: { _id: 1 } }, { $limit: 10 }],
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
    renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$out',
    });
    expect(screen.getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
  });
  it('renders merge preview when operator is $merge', function () {
    renderStagePreview({
      shouldRenderStage: true,
      stageOperator: '$merge',
    });
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
});
