import { ChangeEvent, FormEvent, MouseEventHandler } from 'react';
import { InlineMessageFeedbackProps } from '@lg-chat/message-feedback';
import { MessageRatingValue } from '@lg-chat/message-rating';

import { shim_lib } from '@mongodb-js/compass-components';

export interface MessageActionsProps
  extends shim_lib.DarkModeProps,
    shim_lib.HTMLElementProps<'div'> {
  /**
   * Optional callback fired when the copy button is clicked.
   */
  onClickCopy?: MouseEventHandler<HTMLButtonElement>;

  /**
   * Optional callback fired when the retry button is clicked.
   * @remarks if not provided, the retry button will not be rendered
   */
  onClickRetry?: MouseEventHandler<HTMLButtonElement>;

  /**
   * Optional callback fired when the feedback form is closed by clicking
   * the close button.
   */
  onCloseFeedback?: InlineMessageFeedbackProps['onClose'];

  /**
   * Optional callback fired when the user clicks the like or dislike button.
   * Receives the original change event and an options object with the rating.
   * @remarks if not provided, the rating buttons will not be rendered
   */
  onRatingChange?: (
    e: ChangeEvent<HTMLInputElement>,
    options?: { rating: MessageRatingValue }
  ) => void;

  /**
   * Optional callback when the user submits the feedback form.
   * Receives the original form event, plus an options object with rating and feedback.
   * @remarks if not provided, the feedback form will not be rendered
   */
  onSubmitFeedback?: (
    e: FormEvent<HTMLFormElement>,
    options?: { rating: MessageRatingValue; feedback: string }
  ) => void;

  /**
   * Optional text for the feedback form's submit button.
   * @default 'Submit'
   */
  submitButtonText?: InlineMessageFeedbackProps['submitButtonText'];

  /**
   * Optional success message to display after feedback is submitted.
   * Can be a string or a ReactNode.
   * @default 'Thanks for your feedback!'
   */
  submittedMessage?: InlineMessageFeedbackProps['submittedMessage'];
}
