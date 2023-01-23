import React, { type ComponentProps } from 'react';
import { render, screen, within } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import { FocusModePreview, InputPreview, OutputPreview } from './focus-mode-stage-preview';
import { MERGE_STAGE_PREVIEW_TEXT, OUT_STAGE_PREVIEW_TEXT } from '../../utils/stage';

import configureStore from '../../stores/store';

const renderFocusModePreview = (
  props: Partial<ComponentProps<typeof FocusModePreview>> = {},
) => {
  render(
    <Provider store={configureStore({
      sourcePipeline: [{$match: {_id: 1}}, {$limit: 10}, {$out: 'out'}]
    })}>
      <FocusModePreview
        title=''
        isLoading={false}
        stageIndex={-1}
        stageOperator={null}
        documents={null}
        isMissingAtlasOnlyStageSupport={false}
        {...props}
      />
    </Provider>
  );
};

describe('FocusModeStagePreview', function () {
  it('renders stage input', function () {
    render(<InputPreview />);
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage input/i)).to.exist;
  });

  it('renders stage output', function () {
    render(<OutputPreview />);
    const preview = screen.getByTestId('focus-mode-stage-preview');
    expect(preview).to.exist;
    expect(within(preview).getByText(/stage output/i)).to.exist;
  });

  context('FocusModePreview', function() {
    it('renders loader', function () {
      renderFocusModePreview({
        isLoading: true,
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(preview).to.exist;
      expect(within(preview).getByTitle(/loading/i)).to.exist;
    });
    it('renders list of documents', function () {
      renderFocusModePreview({
        isLoading: false,
        documents: [{_id: 12345}, {_id: 54321}]
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/12345/i)).to.exist;
      expect(within(preview).getByText(/54321/i)).to.exist;
    });
    it('renders no preview documents when its not loading and documents are empty', function () {
      renderFocusModePreview({
        documents: [],
        isLoading: false,
      });
      
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(/no preview documents/i)).to.exist;
    });
    it('renders $out stage preview', function() {
      renderFocusModePreview({
        stageOperator: '$out',
        stageIndex: 2
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(OUT_STAGE_PREVIEW_TEXT)).to.exist;
    });
    it('renders $merge stage preview', function() {
      renderFocusModePreview({
        stageOperator: '$merge',
        stageIndex: 2
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByText(MERGE_STAGE_PREVIEW_TEXT)).to.exist;
    });
    it('renders atlas stage preview', function() {
      renderFocusModePreview({
        stageOperator: '$search',
        stageIndex: 2,
        isMissingAtlasOnlyStageSupport: true
      });
      const preview = screen.getByTestId('focus-mode-stage-preview');
      expect(within(preview).getByTestId('atlas-only-stage-preview')).to.exist;
    });
  });
});