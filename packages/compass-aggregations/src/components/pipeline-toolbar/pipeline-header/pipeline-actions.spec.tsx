import React from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  within,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import ConnectedPipelineActions, { PipelineActions } from './pipeline-actions';
import { renderWithStore } from '../../../../test/configure-store';
import { changeStageDisabled } from '../../../modules/pipeline-builder/stage-editor';
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { AIPipelineActionTypes } from '../../../modules/pipeline-builder/pipeline-ai';

describe('PipelineActions', function () {
  afterEach(cleanup);

  describe('options visible', function () {
    let onRunAggregationSpy: SinonSpy;
    let onToggleOptionsSpy: SinonSpy;
    let onExportAggregationResultsSpy: SinonSpy;
    let onExplainAggregationSpy: SinonSpy;

    beforeEach(function () {
      onRunAggregationSpy = spy();
      onToggleOptionsSpy = spy();
      onExportAggregationResultsSpy = spy();
      onExplainAggregationSpy = spy();

      render(
        <PipelineActions
          isOptionsVisible={true}
          showAIEntry={false}
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={onExportAggregationResultsSpy}
          isExplainButtonDisabled={false}
          onExplainAggregation={onExplainAggregationSpy}
          onUpdateView={() => {}}
          onCollectionScanInsightActionButtonClick={() => {}}
          onShowAIInputClick={() => {}}
        />
      );
    });

    it('calls onRunAggregation callback on click', function () {
      const button = screen.getByTestId('pipeline-toolbar-run-button');
      expect(button).to.exist;

      userEvent.click(button);

      expect(onRunAggregationSpy.calledOnce).to.be.true;
    });

    it('calls onExportAggregationResults on click', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-export-aggregation-button'
      );
      expect(button).to.exist;

      userEvent.click(button);

      expect(onExportAggregationResultsSpy.calledOnce).to.be.true;
    });

    it('calls onExplainAggregation on click', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button'
      );
      expect(button).to.exist;
      userEvent.click(button);
      expect(onExplainAggregationSpy.calledOnce).to.be.true;
    });

    it('calls onToggleOptions on click', function () {
      const button = screen.getByTestId('pipeline-toolbar-options-button');
      expect(button).to.exist;
      expect(button?.textContent?.toLowerCase().trim()).to.equal('options');
      expect(within(button).getByLabelText('Caret Down Icon')).to.exist;

      userEvent.click(button);

      expect(onToggleOptionsSpy.calledOnce).to.be.true;
    });
  });

  describe('options not visible', function () {
    let onRunAggregationSpy: SinonSpy;
    let onToggleOptionsSpy: SinonSpy;
    beforeEach(function () {
      onRunAggregationSpy = spy();
      onToggleOptionsSpy = spy();
      render(
        <PipelineActions
          isOptionsVisible={false}
          showAIEntry={false}
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={() => {}}
          onUpdateView={() => {}}
          onExplainAggregation={() => {}}
          onCollectionScanInsightActionButtonClick={() => {}}
          onShowAIInputClick={() => {}}
        />
      );
    });

    it('toggle options action button', function () {
      const button = screen.getByTestId('pipeline-toolbar-options-button');
      expect(button).to.exist;
      expect(button?.textContent?.toLowerCase().trim()).to.equal('options');
      expect(within(button).getByLabelText('Caret Right Icon')).to.exist;

      userEvent.click(button);

      expect(onToggleOptionsSpy.calledOnce).to.be.true;
    });
  });

  describe('extra options disabled', function () {
    let preferences: PreferencesAccess;
    let onRunAggregationSpy: SinonSpy;
    let onToggleOptionsSpy: SinonSpy;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableAggregationBuilderExtraOptions: false,
      });
      onRunAggregationSpy = spy();
      onToggleOptionsSpy = spy();
      render(
        <PreferencesProvider value={preferences}>
          <PipelineActions
            isOptionsVisible={false}
            showAIEntry={false}
            showRunButton={true}
            showExportButton={true}
            showExplainButton={true}
            onRunAggregation={onRunAggregationSpy}
            onToggleOptions={onToggleOptionsSpy}
            onExportAggregationResults={() => {}}
            onUpdateView={() => {}}
            onExplainAggregation={() => {}}
            onCollectionScanInsightActionButtonClick={() => {}}
            onShowAIInputClick={() => {}}
          />
        </PreferencesProvider>
      );
    });

    it('hides the extra options button when in Cloud mode', function () {
      expect(screen.queryByTestId('pipeline-toolbar-options-button')).to.not
        .exist;
    });
  });

  describe('disables actions when pipeline is invalid', function () {
    let onRunAggregationSpy: SinonSpy;
    let onExportAggregationResultsSpy: SinonSpy;
    let onExplainAggregationSpy: SinonSpy;

    beforeEach(function () {
      onRunAggregationSpy = spy();
      onExportAggregationResultsSpy = spy();
      onExplainAggregationSpy = spy();
      render(
        <PipelineActions
          isExplainButtonDisabled={true}
          isExportButtonDisabled={true}
          isRunButtonDisabled={true}
          isOptionsVisible={true}
          showAIEntry={false}
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={() => {}}
          onExportAggregationResults={onExportAggregationResultsSpy}
          onExplainAggregation={onExplainAggregationSpy}
          onUpdateView={() => {}}
          onCollectionScanInsightActionButtonClick={() => {}}
          onShowAIInputClick={() => {}}
        />
      );
    });

    it('run action disabled', function () {
      const button = screen.getByTestId('pipeline-toolbar-run-button');
      expect(button.getAttribute('aria-disabled')).to.equal('true');

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onRunAggregationSpy.calledOnce).to.be.false;
    });

    it('export action disabled', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-export-aggregation-button'
      );
      expect(button.getAttribute('aria-disabled')).to.equal('true');

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onExportAggregationResultsSpy.calledOnce).to.be.false;
    });

    it('explain action disabled', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button'
      );
      expect(button.getAttribute('aria-disabled')).to.equal('true');

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onExplainAggregationSpy.calledOnce).to.be.false;
    });
  });

  describe('with store', function () {
    async function renderPipelineActions(options = {}) {
      const result = await renderWithStore(
        <ConnectedPipelineActions
          showExplainButton={true}
          showExportButton={true}
          showRunButton={true}
          onToggleOptions={() => {}}
        ></ConnectedPipelineActions>,
        options
      );
      return {
        ...result,
        store: result.plugin.store,
      };
    }

    it('should disable actions when pipeline contains errors', async function () {
      await renderPipelineActions({ pipeline: [42] });

      expect(
        screen
          .getByTestId('pipeline-toolbar-explain-aggregation-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');

      expect(
        screen
          .getByTestId('pipeline-toolbar-export-aggregation-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');

      expect(
        screen
          .getByTestId('pipeline-toolbar-run-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('should disable actions while ai is fetching', async function () {
      const { store } = await renderPipelineActions({
        pipeline: [{ $match: { _id: 1 } }],
      });

      store.dispatch({
        type: AIPipelineActionTypes.AIPipelineStarted,
        requestId: 'pineapples',
      });

      await waitFor(() => {
        expect(
          screen
            .getByTestId('pipeline-toolbar-explain-aggregation-button')
            .getAttribute('aria-disabled')
        ).to.equal('true');

        expect(
          screen
            .getByTestId('pipeline-toolbar-export-aggregation-button')
            .getAttribute('aria-disabled')
        ).to.equal('true');

        expect(
          screen
            .getByTestId('pipeline-toolbar-run-button')
            .getAttribute('aria-disabled')
        ).to.equal('true');
      });
    });

    it('should disable export button when pipeline is $out / $merge', async function () {
      await renderPipelineActions({
        pipeline: [{ $out: 'foo' }],
      });

      expect(
        screen
          .getByTestId('pipeline-toolbar-export-aggregation-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('should disable export button when last enabled stage is $out / $merge', async function () {
      const { store } = await renderPipelineActions({
        pipeline: [{ $out: 'foo' }, { $match: { _id: 1 } }],
      });

      store.dispatch(changeStageDisabled(1, true));

      await waitFor(() => {
        expect(
          screen
            .getByTestId('pipeline-toolbar-export-aggregation-button')
            .getAttribute('aria-disabled')
        ).to.equal('true');
      });
    });
  });
});
