import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';
import preferencesAccess from 'compass-preferences-model';
import userEvent from '@testing-library/user-event';

import { PipelineAI } from './pipeline-ai';
import configureStore from '../../../test/configure-store';
import {
  AIPipelineActionTypes,
  changeAIPromptText,
} from '../../modules/pipeline-builder/pipeline-ai';

const noop = () => {
  /* no op */
};

const renderPipelineAI = ({
  ...props
}: Partial<ComponentProps<typeof PipelineAI>> = {}) => {
  const store = configureStore();

  render(
    <Provider store={store}>
      <PipelineAI onClose={noop} show {...props} />
    </Provider>
  );
  return store;
};

const feedbackPopoverTextAreaId = 'feedback-popover-textarea';
const thumbsUpId = 'ai-feedback-thumbs-up';

describe('PipelineAI Component', function () {
  let store: ReturnType<typeof configureStore>;
  afterEach(cleanup);

  describe('when rendered', function () {
    let onCloseSpy: SinonSpy;
    beforeEach(function () {
      onCloseSpy = sinon.spy();
      store = renderPipelineAI({
        onClose: onCloseSpy,
      });
    });

    it('calls to close robot button is clicked', function () {
      expect(onCloseSpy.called).to.be.false;
      const closeButton = screen.getByTestId('close-ai-button');
      expect(closeButton).to.be.visible;
      closeButton.click();
      expect(onCloseSpy.calledOnce).to.be.true;
    });
  });

  describe('when rendered with text', function () {
    beforeEach(function () {
      store = renderPipelineAI();
      store.dispatch(changeAIPromptText('test'));
    });

    it('calls to clear the text when the X is clicked', function () {
      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        'test'
      );

      const clearTextButton = screen.getByTestId('ai-text-clear-prompt');
      expect(clearTextButton).to.be.visible;
      clearTextButton.click();

      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        ''
      );
    });
  });

  describe('when a pipeline created from query', function () {
    beforeEach(function () {
      store = renderPipelineAI();
    });

    it('inserts user prompt', function () {
      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        ''
      );

      store.dispatch({
        type: AIPipelineActionTypes.AIPipelineCreatedFromQuery,
        text: 'group by price',
      });

      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        'group by price'
      );
    });
  });

  describe('Pipeline AI Feedback', function () {
    let trackUsageStatistics: boolean | undefined;
    let sandbox: sinon.SinonSandbox;

    beforeEach(function () {
      sandbox = sinon.createSandbox();
    });
    afterEach(function () {
      sandbox.restore();
    });

    describe('usage statistics enabled', function () {
      beforeEach(async function () {
        trackUsageStatistics =
          preferencesAccess.getPreferences().trackUsageStatistics;
        sandbox
          .stub(preferencesAccess, 'getPreferences')
          .returns({ trackUsageStatistics: true } as any);
        // 'compass:track' will only emit if tracking is enabled.
        await preferencesAccess.savePreferences({ trackUsageStatistics: true });
        store = renderPipelineAI();
      });

      afterEach(async function () {
        await preferencesAccess.savePreferences({ trackUsageStatistics });
      });

      it('should log a telemetry event with the entered text on submit', async function () {
        // Note: This is coupling this test with internals of the logger and telemetry.
        // We're doing this as this is a unique case where we're using telemetry
        // for feedback. Avoid repeating this elsewhere.
        const trackingLogs: any[] = [];
        process.on('compass:track', (event) => trackingLogs.push(event));

        // No feedback popover is shown yet.
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIPipelineActionTypes.AIPipelineSucceeded,
        });

        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
        const thumbsUpButton = screen.getByTestId(thumbsUpId);
        expect(thumbsUpButton).to.be.visible;
        thumbsUpButton.click();

        const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
        expect(textArea).to.be.visible;
        userEvent.type(textArea, 'this is the pipeline I was looking for');

        screen.getByText('Submit').click();

        await waitFor(
          () => {
            // No feedback popover is shown.
            expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not
              .exist;
            expect(trackingLogs).to.deep.equal([
              {
                event: 'PipelineAI Feedback',
                properties: {
                  feedback: 'positive',
                  text: 'this is the pipeline I was looking for',
                },
              },
            ]);
          },
          { interval: 10 }
        );
      });
    });

    describe('usage statistics disabled', function () {
      beforeEach(async function () {
        trackUsageStatistics =
          preferencesAccess.getPreferences().trackUsageStatistics;
        sandbox
          .stub(preferencesAccess, 'getPreferences')
          .returns({ trackUsageStatistics: false } as any);
        await preferencesAccess.savePreferences({
          trackUsageStatistics: false,
        });
        store = renderPipelineAI();
      });

      afterEach(async function () {
        await preferencesAccess.savePreferences({ trackUsageStatistics });
      });

      it('should not show the feedback items', function () {
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIPipelineActionTypes.AIPipelineSucceeded,
        });

        // No feedback popover is shown.
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;
      });
    });
  });
});
