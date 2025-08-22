import React, {
  ChangeEvent,
  FormEvent,
  MouseEvent,
  useCallback,
  useMemo,
  useState,
} from 'react';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';
import { useMessageContext } from '@lg-chat/message';
import { InlineMessageFeedback } from '@lg-chat/message-feedback';
import { MessageRating, MessageRatingValue } from '@lg-chat/message-rating';

import CheckmarkIcon from '@mongodb-js/compass-components';
import CopyIcon from '@mongodb-js/compass-components';
import RefreshIcon from '@mongodb-js/compass-components';
import IconButton from '@mongodb-js/compass-components';
import LeafyGreenProvider, {
  useDarkMode,
} from '@mongodb-js/compass-components';

import { FEEDBACK_TEXTAREA_TEST_ID } from '../constants';

import {
  actionBarStyles,
  getContainerStyles,
  getDividerStyles,
  primaryActionsContainerStyles,
} from './MessageActions.styles';
import { MessageActionsProps } from './MessageActions.types';

export function MessageActions({
  children: _children,
  className,
  darkMode: darkModeProp,
  onClickCopy,
  onClickRetry,
  onCloseFeedback,
  onRatingChange,
  onSubmitFeedback,
  submitButtonText = 'Submit',
  submittedMessage = 'Thanks for your feedback!',
  ...rest
}: MessageActionsProps) {
  const { darkMode, theme } = useDarkMode(darkModeProp);
  const { variant } = useLeafyGreenChatContext();
  const isCompact = variant === Variant.Compact;
  const { messageBody } = useMessageContext();

  const [copied, setCopied] = useState(false);
  const [rating, setRating] = useState<MessageRatingValue>(
    MessageRatingValue.Unselected
  );
  const [feedback, setFeedback] = useState<string | undefined>(undefined);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleCopy = useCallback(
    async (e: MouseEvent<HTMLButtonElement>) => {
      if (copied || !messageBody) {
        return;
      }

      try {
        await navigator.clipboard.writeText(messageBody);
        setCopied(true);
        onClickCopy?.(e);
        // reset copied state after 1.5 seconds
        setTimeout(() => setCopied(false), 1500);
      } catch (_err) {
        onClickCopy?.(e);
      }
    },
    [copied, messageBody, onClickCopy]
  );

  const handleRatingChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (isSubmitted) {
        return;
      }

      const newRating = e.target.value as MessageRatingValue;
      setRating(newRating);

      onRatingChange?.(e, { rating: newRating });
    },
    [isSubmitted, onRatingChange]
  );

  const handleFeedbackChange = useCallback(
    (e: ChangeEvent<HTMLTextAreaElement>) => {
      if (isSubmitted) {
        return;
      }
      setFeedback(e.target.value);
    },
    [isSubmitted]
  );

  /**
   * This callback is called when the user submits the feedback form.
   * Feedback collection is not critical to the user's experience, so
   * if it fails, it fails silently.
   */
  const handleFeedbackSubmit = useCallback(
    (e: FormEvent<HTMLFormElement>) => {
      if (rating === MessageRatingValue.Unselected || !feedback) {
        return;
      }

      onSubmitFeedback?.(e, { rating, feedback });
      setIsSubmitted(true);
    },
    [feedback, onSubmitFeedback, rating]
  );

  const handleCloseFeedback = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      setRating(MessageRatingValue.Unselected);
      setFeedback(undefined);
      onCloseFeedback?.(e);
    },
    [onCloseFeedback]
  );

  const showMessageRating = !!onRatingChange;
  const showFeedbackForm =
    rating !== MessageRatingValue.Unselected && !!onSubmitFeedback;

  const textareaProps = useMemo(
    () => ({
      'data-testid': FEEDBACK_TEXTAREA_TEST_ID,
      onChange: handleFeedbackChange,
      value: feedback,
    }),
    [handleFeedbackChange, feedback]
  );

  if (!isCompact) {
    return null;
  }

  return (
    <LeafyGreenProvider darkMode={darkMode}>
      <div className={getContainerStyles({ className, isSubmitted })} {...rest}>
        <div className={actionBarStyles}>
          <div className={primaryActionsContainerStyles}>
            <IconButton
              aria-label="Copy message"
              onClick={handleCopy}
              title="Copy"
            >
              {copied ? <CheckmarkIcon /> : <CopyIcon />}
            </IconButton>
            {onClickRetry && (
              <IconButton
                aria-label="Retry message"
                onClick={onClickRetry}
                title="Retry"
              >
                <RefreshIcon />
              </IconButton>
            )}
          </div>
          {showMessageRating && (
            <>
              <div className={getDividerStyles(theme)} />
              <MessageRating
                // @ts-expect-error - react type issue: https://github.com/facebook/react/pull/24730
                inert={isSubmitted ? 'inert' : undefined}
                onChange={handleRatingChange}
                value={rating}
              />
            </>
          )}
        </div>
        {showFeedbackForm && (
          <InlineMessageFeedback
            isSubmitted={isSubmitted}
            label="Provide feedback"
            onClose={handleCloseFeedback}
            onSubmit={handleFeedbackSubmit}
            submitButtonText={submitButtonText}
            submittedMessage={submittedMessage}
            textareaProps={textareaProps}
          />
        )}
      </div>
    </LeafyGreenProvider>
  );
}

MessageActions.displayName = 'MessageActions';
