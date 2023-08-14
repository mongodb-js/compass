import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import { Provider } from 'react-redux';

import { AITextInput } from './ai-text-input';
import { configureStore } from '../../stores/query-bar-store';
import {
  AIQueryActionTypes,
  changeAIPromptText,
} from '../../stores/ai-query-reducer';
import { DEFAULT_FIELD_VALUES } from '../../constants/query-bar-store';
import { mapQueryToFormFields } from '../../utils/query';

const noop = () => {
  /* no op */
};

const renderAITextInput = ({
  ...props
}: Partial<ComponentProps<typeof AITextInput>> = {}) => {
  const store = configureStore();

  render(
    <Provider store={store}>
      <AITextInput onClose={noop} show {...props} />
    </Provider>
  );
  return store;
};

const feedbackPopoverTextAreaId = 'feedback-popover-textarea';

describe('QueryBar Component', function () {
  let store: ReturnType<typeof configureStore>;
  let onCloseSpy: SinonSpy;
  beforeEach(function () {
    onCloseSpy = sinon.spy();
  });
  afterEach(cleanup);

  describe('when rendered', function () {
    beforeEach(function () {
      store = renderAITextInput({
        onClose: onCloseSpy,
      });
    });

    it('calls to close robot button is clicked', function () {
      expect(onCloseSpy.called).to.be.false;
      const closeButton = screen.getByTestId('close-ai-query-button');
      expect(closeButton).to.be.visible;
      closeButton.click();
      expect(onCloseSpy.calledOnce).to.be.true;
    });
  });

  describe('when rendered with text', function () {
    beforeEach(function () {
      store = renderAITextInput({
        onClose: onCloseSpy,
      });
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

  describe('QueryFeedback', function () {
    beforeEach(function () {
      store = renderAITextInput({
        onClose: onCloseSpy,
      });
    });

    it('should log a telemetry event with the entered text on submit', async function () {
      // Note: This is coupling this test with internals of the logger and telemetry.
      // We're doing this as this is a unique case where we're using telemetry
      // for feedback. Avoid repeating this elsewhere.
      const trackingLogs: any[] = [];
      process.on('compass:track', (event) => trackingLogs.push(event));

      // No feedback popover is shown yet.
      expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
      expect(screen.queryByTestId('ai-query-feedback-thumbs-up')).to.not.exist;

      store.dispatch({
        type: AIQueryActionTypes.AIQuerySucceeded,
        fields: mapQueryToFormFields(DEFAULT_FIELD_VALUES),
      });

      expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;
      const thumbsUpButton = screen.getByTestId('ai-query-feedback-thumbs-up');
      expect(thumbsUpButton).to.be.visible;
      thumbsUpButton.click();

      const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
      expect(textArea).to.be.visible;
      fireEvent.change(textArea, {
        target: { value: 'this is the query I was looking for' },
      });

      screen.getByText('Submit').click();

      // Let the track event occur.
      await new Promise((resolve) => setTimeout(resolve, 6));

      // No feedback popover is shown.
      expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

      expect(trackingLogs).to.deep.equal([
        {
          event: 'AIQuery Feedback',
          properties: {
            feedback: 'positive',
            text: 'this is the query I was looking for',
          },
        },
      ]);
    });
  });
});
