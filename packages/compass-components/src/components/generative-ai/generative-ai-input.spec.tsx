import React from 'react';
import type { ComponentProps } from 'react';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { expect } from 'chai';
import sinon from 'sinon';
import type { SinonSpy } from 'sinon';

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
      const clearTextButton = screen.getByTestId('ai-text-clear-prompt');
      expect(clearTextButton).to.be.visible;
      clearTextButton.click();

      expect(onChangeAIPromptTextSpy).to.be.calledOnceWith('');
    });
  });

  describe('AIFeedback', function () {
    it('should call the feedback handler on submit', async function () {
      let feedbackChoice;
      let feedbackText;

      renderGenerativeAIInput({
        onSubmitFeedback: (_feedbackChoice, _feedbackText) => {
          feedbackChoice = _feedbackChoice;

          feedbackText = _feedbackText;
        },
        didSucceed: true,
      });

      // No feedback popover is shown yet.
      expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

      const thumbsUpButton = screen.getByTestId('ai-feedback-thumbs-up');
      expect(thumbsUpButton).to.be.visible;
      thumbsUpButton.click();

      const textArea = screen.getByTestId(feedbackPopoverTextAreaId);
      expect(textArea).to.be.visible;
      fireEvent.change(textArea, {
        target: { value: 'this is the query I was looking for' },
      });

      await waitFor(() => fireEvent.click(screen.getByText('Submit')));

      // No feedback popover is shown.
      expect(screen.queryByTestId(feedbackPopoverTextAreaId)).to.not.exist;

      expect(feedbackChoice).to.equal('positive');
      expect(feedbackText).to.equal('this is the query I was looking for');
    });
  });
});
