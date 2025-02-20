import React from 'react';
import type { ComponentProps } from 'react';
import {
  cleanup,
  render,
  screen,
  waitFor,
  userEvent,
} from '@mongodb-js/testing-library-compass';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from '../stores/context';

import { QueryAI } from './query-ai';
import type { QueryBarExtraArgs } from '../stores/query-bar-store';
import { configureStore } from '../stores/query-bar-store';
import {
  AIQueryActionTypes,
  changeAIPromptText,
} from '../stores/ai-query-reducer';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import { mapQueryToFormFields } from '../utils/query';
import type { PreferencesAccess } from 'compass-preferences-model';
import { createSandboxFromDefaultPreferences } from 'compass-preferences-model';
import { PreferencesProvider } from 'compass-preferences-model/provider';
import {
  LoggerProvider,
  createNoopLogger,
} from '@mongodb-js/compass-logging/provider';
import { TelemetryProvider } from '@mongodb-js/compass-telemetry/provider';

const noop = () => {
  /* no op */
};

const feedbackPopoverTextAreaId = 'feedback-popover-textarea';
const thumbsUpId = 'ai-feedback-thumbs-up';

describe('QueryAI Component', function () {
  let preferences: PreferencesAccess;
  let store: ReturnType<typeof configureStore>;
  let trackingEvents: any[] = [];
  const track = (event: any, properties: any) => {
    trackingEvents.push({
      event,
      properties: typeof properties === 'function' ? properties() : properties,
    });
  };

  afterEach(cleanup);

  const renderQueryAI = ({
    ...props
  }: Partial<ComponentProps<typeof QueryAI>> = {}) => {
    const store = configureStore({}, {
      preferences,
    } as Partial<QueryBarExtraArgs> as QueryBarExtraArgs);

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
              <QueryAI onClose={noop} show {...props} />
            </Provider>
          </TelemetryProvider>
        </LoggerProvider>
      </PreferencesProvider>
    );
    return store;
  };

  beforeEach(async function () {
    preferences = await createSandboxFromDefaultPreferences();
  });

  afterEach(function () {
    trackingEvents = [];
    cleanup();
    sinon.restore();
  });

  describe('when rendered', function () {
    let onCloseSpy: SinonSpy;
    beforeEach(function () {
      onCloseSpy = sinon.spy();
      store = renderQueryAI({
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
      store = renderQueryAI();
      store.dispatch(changeAIPromptText('test'));
    });

    it('calls to clear the text when the X is clicked', function () {
      expect(store.getState().aiQuery.aiPromptText).to.equal('test');

      const clearTextButton = screen.getByTestId('ai-text-clear-prompt');
      expect(clearTextButton).to.be.visible;
      clearTextButton.click();

      expect(store.getState().aiQuery.aiPromptText).to.equal('');
    });
  });

  describe('Query AI Feedback', function () {
    describe('usage statistics enabled', function () {
      beforeEach(async function () {
        // Elements will render only if `trackUsageStatistics` is true
        await preferences.savePreferences({ trackUsageStatistics: true });
        store = renderQueryAI();
      });

      it('should log a telemetry event with the entered text on submit', async function () {
        // No feedback popover is shown yet.
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIQueryActionTypes.AIQuerySucceeded,
          fields: mapQueryToFormFields({}, DEFAULT_FIELD_VALUES),
          requestId: 'pineapple',
        });

        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
        const thumbsUpButton = screen.getByTestId(thumbsUpId);
        expect(thumbsUpButton).to.be.visible;
        thumbsUpButton.click();

        const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
        expect(textArea).to.be.visible;
        userEvent.type(textArea, 'this is the query I was looking for');

        screen.getByText('Submit').click();

        await waitFor(
          () => {
            // No feedback popover is shown.
            expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not
              .exist;
            expect(trackingEvents).to.deep.equal([
              {
                event: 'AI Query Feedback',
                properties: {
                  feedback: 'positive',
                  request_id: 'pineapple',
                  text: 'this is the query I was looking for',
                  connection_id: 'TEST',
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
        store = renderQueryAI();
      });

      it('should not show the feedback items', function () {
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;

        store.dispatch({
          type: AIQueryActionTypes.AIQuerySucceeded,
          fields: mapQueryToFormFields({}, DEFAULT_FIELD_VALUES),
        });

        // No feedback popover is shown.
        expect(screen.queryByTestId(thumbsUpId)).to.not.exist;
      });
    });
  });
});
