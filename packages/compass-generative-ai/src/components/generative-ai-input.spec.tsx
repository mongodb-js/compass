import React from 'react';
import type { ComponentProps } from 'react';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';
import userEvent from '@testing-library/user-event';

import { GenerativeAIInput } from './generative-ai-input';

const noop = () => {
  /* no op */
};

const renderGenerativeAIInput = ({
  ...props
}: Partial<ComponentProps<typeof GenerativeAIInput>> = {}) => {
  render(
    <GenerativeAIInput
      aiPromptText=""
      didSucceed={false}
      onCancelRequest={noop}
      onChangeAIPromptText={noop}
      onSubmitText={noop as any}
      onClose={noop}
      onSubmitFeedback={noop as any}
      show
      {...props}
    />
  );
};

const feedbackPopoverTextAreaId = 'feedback-popover-textarea';
const thumbsUpId = 'ai-feedback-thumbs-up';
const aiGuideCueDescriptionSpanId = 'ai-guide-cue-description-span';

describe('GenerativeAIInput Component', function () {
  afterEach(cleanup);

  describe('when rendered', function () {
    let onCloseSpy: SinonSpy;

    beforeEach(function () {
      onCloseSpy = sinon.spy();
      renderGenerativeAIInput({
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
    let onChangeAIPromptTextSpy: SinonSpy;

    beforeEach(function () {
      onChangeAIPromptTextSpy = sinon.spy();
      renderGenerativeAIInput({
        onChangeAIPromptText: onChangeAIPromptTextSpy,
        aiPromptText: 'test',
      });
    });

    it('calls to clear the text when the X is clicked', function () {
      userEvent.click(screen.getByRole('button', { name: 'Clear prompt' }));
      expect(onChangeAIPromptTextSpy).to.be.calledOnceWith('');
    });

    it('does not show an error', function () {
      expect(screen.queryByTestId('ai-error-msg')).to.be.null;
    });
  });

  describe('when rendered with an error', function () {
    [
      [
        'NOT_SUPPORTED',
        'Sorry, this version of Compass is no longer suitable to generate queries. Please update to the latest version to access all the features.',
      ],
      [
        'USER_INPUT_TOO_LONG',
        'Looks like your input exceeds the allowed length. Please reduce it and submit your prompt again.',
      ],
      [
        'PROMPT_TOO_LONG',
        'Sorry, your collections have too many fields to process. Please try using this feature on a collection with smaller documents.',
      ],
      [
        'TOO_MANY_REQUESTS',
        'Sorry, we are receiving too many requests in a short period of time. Please wait a few minutes and try again.',
      ],
      [
        'GATEWAY_TIMEOUT',
        'It took too long to generate your query, please check your connection and try again. If the problem persists, contact our support team.',
      ],
      [
        'QUERY_GENERATION_FAILED',
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.',
      ],
    ].forEach(([errorCode, expectedText]) => {
      it(`renders an error for ${errorCode}`, function () {
        renderGenerativeAIInput({
          errorMessage: '...',
          errorCode,
        });

        const errorMsg = screen.getByTestId('ai-error-msg');
        expect(errorMsg).to.have.text(expectedText);
        expect(errorMsg).to.be.visible;
      });
    });

    it(`renders errorMessage if errorCode is missing`, function () {
      renderGenerativeAIInput({
        errorMessage: 'An error occurred',
        errorCode: '',
      });

      const errorMsg = screen.getByTestId('ai-error-msg');
      expect(errorMsg).to.have.text('An error occurred');
      expect(errorMsg).to.be.visible;
    });

    it(`renders a default error if errorCode is unknown`, function () {
      renderGenerativeAIInput({
        errorMessage: 'An error occurred',
        errorCode: 'SOME_UNEXPECTED_ERROR_CODE',
      });

      const errorMsg = screen.getByTestId('ai-error-msg');
      expect(errorMsg).to.have.text(
        'Sorry, we were unable to generate the query, please try again. If the error persists, try changing your prompt.'
      );
      expect(errorMsg).to.be.visible;
    });
  });

  describe('AIFeedback', function () {
    describe('when onSubmitFeedback is passed', function () {
      let feedbackChoice: 'negative' | 'positive' | 'dismissed' | undefined;
      let feedbackText: string | undefined;

      beforeEach(function () {
        feedbackChoice = undefined;
        feedbackText = undefined;

        renderGenerativeAIInput({
          onSubmitFeedback: (_feedbackChoice, _feedbackText) => {
            feedbackChoice = _feedbackChoice;

            feedbackText = _feedbackText;
          },
          didSucceed: true,
        });
      });

      it('should have feedback options and call the feedback handler on submit', async function () {
        // No feedback popover is shown yet.
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

        userEvent.click(
          screen.getByRole('button', { name: 'Submit positive feedback' })
        );

        const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
        expect(textArea).to.be.visible;
        userEvent.type(textArea, 'this is the query I was looking for');
        userEvent.click(screen.getByRole('button', { name: 'Submit' }));

        // No feedback popover is shown.
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

        await waitFor(function () {
          expect(feedbackChoice).to.equal('positive');
          expect(feedbackText).to.equal('this is the query I was looking for');
        });
      });
    });

    describe('when onSubmitFeedback is not passed', function () {
      beforeEach(function () {
        renderGenerativeAIInput({
          onSubmitFeedback: undefined,
          didSucceed: true,
        });
      });

      it('should not have feedback options', function () {
        expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

        const thumbsUpButton = screen.queryByTestId(thumbsUpId);
        expect(thumbsUpButton).to.not.exist;
      });
    });
  });

  describe('Aggregation created guide cue', function () {
    it('should call the hide guide cue handler on submit', async function () {
      let resetIsAggregationGeneratedFromQueryCalled = false;

      renderGenerativeAIInput({
        onResetIsAggregationGeneratedFromQuery: () => {
          resetIsAggregationGeneratedFromQueryCalled = true;
        },
        isAggregationGeneratedFromQuery: true,
      });

      expect(screen.queryByTestId(aiGuideCueDescriptionSpanId)).to.exist;
      userEvent.click(screen.getByRole('button', { name: 'Got it' }));
      await waitFor(function () {
        expect(resetIsAggregationGeneratedFromQueryCalled).to.equal(true);
      });
    });
  });
});
