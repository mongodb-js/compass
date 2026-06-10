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
import {
  type PreferencesAccess,
  createSandboxFromDefaultPreferences,
} from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import { AIPipelineActionTypes } from '../../../modules/pipeline-builder/pipeline-ai';

function renderPipelineActions(
  props: React.ComponentProps<typeof PipelineActions>,
  preferences?: PreferencesAccess
) {
  const component = <PipelineActions {...props} />;
  if (preferences) {
    return render(
      <PreferencesProvider value={preferences}>{component}</PreferencesProvider>
    );
  }
  return render(component);
}

describe('PipelineActions', function () {
  afterEach(cleanup);

  describe('options visible', function () {
    let onRunAggregationSpy: SinonSpy;
    let onToggleOptionsSpy: SinonSpy;
    let onExplainAggregationSpy: SinonSpy;
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      onRunAggregationSpy = spy();
      onToggleOptionsSpy = spy();
      onExplainAggregationSpy = spy();
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableSearchActivationProgramP2: true,
      });

      renderPipelineActions(
        {
          isOptionsVisible: true,
          showAIEntry: false,
          showRunButton: true,
          showExplainButton: true,
          onRunAggregation: onRunAggregationSpy,
          onToggleOptions: onToggleOptionsSpy,
          isExplainButtonDisabled: false,
          onExplainAggregationVisualTree: onExplainAggregationSpy,
          onExplainAggregationRawOutput: () => {},
          onExplainAggregationInterpret: () => {},
          onUpdateView: () => {},
          onCollectionScanInsightActionButtonClick: () => {},
          onShowAIInputClick: () => {},
          stages: [],
        },
        preferences
      );
    });

    it('calls onRunAggregation callback on click', function () {
      const button = screen.getByTestId('pipeline-toolbar-run-button');
      expect(button).to.exist;

      userEvent.click(button);

      expect(onRunAggregationSpy.calledOnce).to.be.true;
    });

    it('calls onExplainAggregation when Visual tree is selected', async function () {
      const trigger = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button-show-actions'
      );
      expect(trigger).to.exist;
      userEvent.click(trigger);
      const visualTreeItem = await screen.findByText('Visual tree');
      userEvent.click(visualTreeItem);
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
          showExplainButton={true}
          onRunAggregation={onRunAggregationSpy}
          onToggleOptions={onToggleOptionsSpy}
          onUpdateView={() => {}}
          onExplainAggregationVisualTree={() => {}}
          onExplainAggregationRawOutput={() => {}}
          onExplainAggregationInterpret={() => {}}
          onCollectionScanInsightActionButtonClick={() => {}}
          onShowAIInputClick={() => {}}
          stages={[]}
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
            showExplainButton={true}
            onRunAggregation={onRunAggregationSpy}
            onToggleOptions={onToggleOptionsSpy}
            onUpdateView={() => {}}
            onExplainAggregationVisualTree={() => {}}
            onCollectionScanInsightActionButtonClick={() => {}}
            onShowAIInputClick={() => {}}
            stages={[]}
          />
        </PreferencesProvider>
      );
    });

    it('hides the extra options button when in Cloud mode', function () {
      expect(screen.queryByTestId('pipeline-toolbar-options-button')).to.not
        .exist;
    });
  });

  describe('when enableSearchActivationProgramP2 is false', function () {
    let onExplainAggregationSpy: SinonSpy;
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      onExplainAggregationSpy = spy();
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableSearchActivationProgramP2: false,
      });

      renderPipelineActions(
        {
          isOptionsVisible: true,
          showAIEntry: false,
          showRunButton: true,
          showExplainButton: true,
          onRunAggregation: () => {},
          onToggleOptions: () => {},
          isExplainButtonDisabled: false,
          onExplainAggregationVisualTree: onExplainAggregationSpy,
          onExplainAggregationRawOutput: () => {},
          onExplainAggregationInterpret: () => {},
          onUpdateView: () => {},
          onCollectionScanInsightActionButtonClick: () => {},
          onShowAIInputClick: () => {},
          stages: [],
        },
        preferences
      );
    });

    it('calls onExplainAggregation on click', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button'
      );
      expect(button).to.exist;
      userEvent.click(button);
      expect(onExplainAggregationSpy.calledOnce).to.be.true;
    });
  });

  describe('disables actions when pipeline is invalid', function () {
    let onRunAggregationSpy: SinonSpy;
    let onExplainAggregationSpy: SinonSpy;
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      onRunAggregationSpy = spy();
      onExplainAggregationSpy = spy();
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableSearchActivationProgramP2: true,
      });

      renderPipelineActions(
        {
          isExplainButtonDisabled: true,
          isRunButtonDisabled: true,
          isOptionsVisible: true,
          showAIEntry: false,
          showRunButton: true,
          showExplainButton: true,
          onRunAggregation: onRunAggregationSpy,
          onToggleOptions: () => {},
          onExplainAggregationVisualTree: onExplainAggregationSpy,
          onExplainAggregationRawOutput: () => {},
          onExplainAggregationInterpret: () => {},
          onUpdateView: () => {},
          onCollectionScanInsightActionButtonClick: () => {},
          onShowAIInputClick: () => {},
          stages: [],
        },
        preferences
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

    it('explain action disabled', function () {
      const button = screen.getByTestId(
        'pipeline-toolbar-explain-aggregation-button-show-actions'
      );
      expect(
        button.getAttribute('disabled') !== null ||
          button.getAttribute('aria-disabled') === 'true'
      ).to.be.true;

      userEvent.click(button, undefined, {
        skipPointerEventsCheck: true,
      });
      expect(onExplainAggregationSpy.calledOnce).to.be.false;
    });
  });

  describe('with store', function () {
    let preferences: PreferencesAccess;

    beforeEach(async function () {
      preferences = await createSandboxFromDefaultPreferences();
      await preferences.savePreferences({
        enableSearchActivationProgramP2: true,
      });
    });

    async function renderPipelineActionsWithStore(options = {}) {
      const result = await renderWithStore(
        <ConnectedPipelineActions
          showExplainButton={true}
          showRunButton={true}
          onToggleOptions={() => {}}
        ></ConnectedPipelineActions>,
        options,
        {},
        { preferences }
      );
      return {
        ...result,
        store: result.plugin.store,
      };
    }

    it('should disable actions when pipeline contains errors', async function () {
      await renderPipelineActionsWithStore({ pipeline: [42] });

      expect(
        screen
          .getByTestId(
            'pipeline-toolbar-explain-aggregation-button-show-actions'
          )
          .getAttribute('aria-disabled')
      ).to.equal('true');

      expect(
        screen
          .getByTestId('pipeline-toolbar-run-button')
          .getAttribute('aria-disabled')
      ).to.equal('true');
    });

    it('should disable actions while ai is fetching', async function () {
      const { store } = await renderPipelineActionsWithStore({
        pipeline: [{ $match: { _id: 1 } }],
      });

      store.dispatch({
        type: AIPipelineActionTypes.AIPipelineStarted,
        requestId: 'pineapples',
      });

      await waitFor(() => {
        expect(
          screen
            .getByTestId(
              'pipeline-toolbar-explain-aggregation-button-show-actions'
            )
            .getAttribute('aria-disabled')
        ).to.equal('true');

        expect(
          screen
            .getByTestId('pipeline-toolbar-run-button')
            .getAttribute('aria-disabled')
        ).to.equal('true');
      });
    });
  });
});
