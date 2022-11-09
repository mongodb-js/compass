import React from 'react';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';
import ConnectedPipelineActions, { PipelineActions } from './pipeline-actions';
import configureStore from '../../../stores/store';
import { Provider } from 'react-redux';
import { changeStageDisabled } from '../../../modules/pipeline-builder/stage-editor';

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
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={onExportAggregationResultsSpy}
          isExplainButtonDisabled={false}
          onExplainAggregation={onExplainAggregationSpy}
          onUpdateView={() => {}}
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
      expect(button?.textContent?.toLowerCase().trim()).to.equal('less options');
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
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={() => {}}
          onUpdateView={() => {}}
          onExplainAggregation={() => {}}
        />
      );
    });

    it('toggle options action button', function () {
      const button = screen.getByTestId('pipeline-toolbar-options-button');
      expect(button).to.exist;
      expect(button?.textContent?.toLowerCase().trim()).to.equal('more options');
      expect(within(button).getByLabelText('Caret Right Icon')).to.exist;

      userEvent.click(button);

      expect(onToggleOptionsSpy.calledOnce).to.be.true;
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
          showRunButton={true}
          showExportButton={true}
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={() => {}}
          onExportAggregationResults={onExportAggregationResultsSpy}
          onExplainAggregation={onExplainAggregationSpy}
          onUpdateView={() => {}}
        />
      );
    });

    it('run action disabled', function () {
      const button = screen.getByTestId('pipeline-toolbar-run-button');
      expect(button.getAttribute('disabled')).to.exist;

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onRunAggregationSpy.calledOnce).to.be.false;
    });

    it('export action disabled', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-export-aggregation-button'
      );
      expect(button.getAttribute('disabled')).to.exist;

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onExportAggregationResultsSpy.calledOnce).to.be.false;
    });

    it('explain action disabled', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button'
      );
      expect(button.getAttribute('disabled')).to.exist;

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onExplainAggregationSpy.calledOnce).to.be.false;
    });
  });

  describe('with store', function () {
    function renderPipelineActions(options = {}) {
      const store = configureStore(options);

      const component = (
        <Provider store={store}>
          <ConnectedPipelineActions
            showExplainButton={true}
            showExportButton={true}
            showRunButton={true}
            onToggleOptions={() => {}}
          ></ConnectedPipelineActions>
        </Provider>
      );

      const result = render(component);
      return {
        ...result,
        store,
        rerender: () => {
          result.rerender(component);
        }
      };
    }

    it('should disable actions when pipeline contains errors', function () {
      renderPipelineActions({ sourcePipeline: [{}] });

      expect(
        screen.getByTestId('pipeline-toolbar-explain-aggregation-button')
      ).to.have.attribute('disabled');

      expect(
        screen.getByTestId('pipeline-toolbar-export-aggregation-button')
      ).to.have.attribute('disabled');

      expect(
        screen.getByTestId('pipeline-toolbar-run-button')
      ).to.have.attribute('disabled');
    });

    it('should disable export button when pipeline is $out / $merge', function () {
      renderPipelineActions({
        sourcePipeline: [{ $out: 'foo' }]
      });

      expect(
        screen.getByTestId('pipeline-toolbar-export-aggregation-button')
      ).to.have.attribute('disabled');
    });

    it('should disable export button when last enabled stage is $out / $merge', function () {
      const { store, rerender } = renderPipelineActions({
        sourcePipeline: [{ $out: 'foo' }, { $match: { _id: 1 } }]
      });

      store.dispatch(changeStageDisabled(1, true));

      rerender();

      expect(
        screen.getByTestId('pipeline-toolbar-export-aggregation-button')
      ).to.have.attribute('disabled');
    });
  });
});
