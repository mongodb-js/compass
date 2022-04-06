import React from 'react';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'chai';
import { spy } from 'sinon';
import type { SinonSpy } from 'sinon';

import { PipelineActions } from './pipeline-actions';

describe('PipelineActions', function () {
  describe('options visible', function () {
    let onRunAggregationSpy: SinonSpy;
    let onToggleOptionsSpy: SinonSpy;
    let onExportAggregationResultsSpy: SinonSpy;
    beforeEach(function () {
      onRunAggregationSpy = spy();
      onToggleOptionsSpy = spy();
      onExportAggregationResultsSpy = spy();
      render(
        <PipelineActions
          isOptionsVisible={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={onExportAggregationResultsSpy}
        />
      );
    });

    it('run action button', function () {

      const button = screen.getByTestId('pipeline-toolbar-run-button');
      expect(button).to.exist;

      userEvent.click(button);

      expect(onRunAggregationSpy.calledOnce).to.be.true;
      expect(onRunAggregationSpy.firstCall.args).to.be.empty;
    });

    it('export action button', function () {
      process.env.COMPASS_ENABLE_AGGREGATION_EXPORT = 'true';
      render(
        <PipelineActions
          isOptionsVisible={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onExportAggregationResults={onExportAggregationResultsSpy}
        />
      );
      const button = screen.getByTestId('pipeline-toolbar-export-aggregation-button');
      expect(button).to.exist;

      userEvent.click(button);

      expect(onExportAggregationResultsSpy.calledOnce).to.be.true;
      expect(onExportAggregationResultsSpy.firstCall.args).to.be.empty;
      delete process.env.COMPASS_ENABLE_AGGREGATION_EXPORT
    });

    it('toggle options action button', function () {
      const button = screen.getByTestId('pipeline-toolbar-options-button');
      expect(button).to.exist;
      expect(button.textContent.toLowerCase().trim()).to.equal('less options');
      expect(within(button).getByLabelText('Caret Down Icon')).to.exist;

      userEvent.click(button);

      expect(onToggleOptionsSpy.calledOnce).to.be.true;
      expect(onToggleOptionsSpy.firstCall.args).to.be.empty;
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
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
        />
      );
    });

    it('toggle options action button', function () {
      const button = screen.getByTestId('pipeline-toolbar-options-button');
      expect(button).to.exist;
      expect(button.textContent.toLowerCase().trim()).to.equal('more options');
      expect(within(button).getByLabelText('Caret Right Icon')).to.exist;

      userEvent.click(button);

      expect(onToggleOptionsSpy.calledOnce).to.be.true;
      expect(onToggleOptionsSpy.firstCall.args).to.be.empty;
    });
  });
});
