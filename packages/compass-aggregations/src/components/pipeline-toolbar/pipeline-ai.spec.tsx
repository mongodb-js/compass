import React from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import { Provider } from 'react-redux';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import userEvent from '@testing-library/user-event';
import PipelineAI from './pipeline-ai';
import configureStore, {
  MockAtlasAiService,
} from '../../../test/configure-store';
import {
  AIPipelineActionTypes,
  changeAIPromptText,
  showInput,
} from '../../modules/pipeline-builder/pipeline-ai';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  LoggerProvider,
  createNoopLogger,
} from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';

const feedbackPopoverTextAreaId = 'feedback-popover-textarea';
const thumbsUpId = 'ai-feedback-thumbs-up';

describe('PipelineAI Component', function () {
  let preferences: PreferencesAccess;
  let store: ReturnType<typeof configureStore>;
  let trackingEvents: any[] = [];
  const track = (event: any, properties: any) => {
    trackingEvents.push({
      event,
      properties: typeof properties === 'function' ? properties() : properties,
    });
  };

  const renderPipelineAI = () => {
    const atlasAiService = new MockAtlasAiService();
    const store = configureStore({}, undefined, {
      preferences,
      atlasAiService: atlasAiService as any,
    });
    render(
      // TODO(COMPASS-7415): use default values instead of updating values
      <PreferencesProvider value={preferences}>
        <LoggerProvider
          value={
            {
              createLogger() {
                return createNoopLogger();
              },
            } as any
          }
        >
          <TelemetryProvider
            options={{
              sendTrack: track,
            }}
          >
            <Provider store={store}>
              <PipelineAI />
            </Provider>
          </TelemetryProvider>
        </LoggerProvider>
      </PreferencesProvider>
    );
    return store;
  };

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
    store = renderPipelineAI();
    await store.dispatch(showInput());
  });

  afterEach(function () {
    trackingEvents = [];
    (store as any) = null;
    cleanup();
  });

  describe('when rendered', function () {
    it('closes the input', async function () {
      userEvent.click(screen.getByRole('button', { name: 'Close AI Helper' }));
      expect(await screen.queryByTestId('close-ai-button')).to.eq(null);
    });
  });

  describe('when rendered with text', function () {
    beforeEach(function () {
      store.dispatch(changeAIPromptText('test'));
    });

    it('calls to clear the text when the X is clicked', function () {
      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        'test'
      );

      userEvent.click(screen.getByRole('button', { name: 'Clear prompt' }));

      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        ''
      );
    });
  });

  describe('when a pipeline created from query', function () {
    it('inserts user prompt', function () {
      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        ''
      );

      store.dispatch({
        type: AIPipelineActionTypes.PipelineGeneratedFromQuery,
        pipelineText: '[{$group: {_id: "$price"}}]',
        pipeline: [{ $group: { _id: '$price' } }],
        syntaxErrors: [],
        stages: [],
        text: 'group by price',
      });

      expect(store.getState().pipelineBuilder.aiPipeline.aiPromptText).to.equal(
        'group by price'
      );
    });
  });

  describe('Pipeline AI Feedback', function () {
    describe('usage statistics enabled', function () {
      beforeEach(async function () {
        // Elements will render only if `trackUsageStatistics` is true
        await preferences.savePreferences({ trackUsageStatistics: true });
        store = renderPipelineAI();
        await store.dispatch(showInput());
      });

      it('should log a telemetry event with the entered text on submit', async function () {
        // No feedback popover is shown yet.
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIPipelineActionTypes.LoadGeneratedPipeline,
          pipelineText: '[{$group: {_id: "$price"}}]',
          requestId: 'pineapple',
          pipeline: [{ $group: { _id: '$price' } }],
          syntaxErrors: [],
          stages: [],
        });

        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

        userEvent.click(
          screen.getByRole('button', { name: 'Submit positive feedback' })
        );

        const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
        expect(textArea).to.be.visible;

        userEvent.type(textArea, 'this is the pipeline I was looking for');

        userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        await waitFor(
          () => {
            // No feedback popover is shown.
            expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not
              .exist;
            expect(trackingEvents).to.deep.equal([
              {
                event: 'PipelineAI Feedback',
                properties: {
                  connection_id: 'TEST',
                  feedback: 'positive',
                  request_id: 'pineapple',
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
        await preferences.savePreferences({
          trackUsageStatistics: false,
        });
        store = renderPipelineAI();
      });

      it('should not show the feedback items', function () {
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIPipelineActionTypes.LoadGeneratedPipeline,
          pipelineText: '[{$group: {_id: "$price"}}]',
          pipeline: [{ $group: { _id: '$price' } }],
          syntaxErrors: [],
          stages: [],
        });

        // No feedback popover is shown.
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;
      });
    });
  });
});
