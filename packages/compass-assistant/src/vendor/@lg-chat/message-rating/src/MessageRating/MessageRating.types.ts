import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

export const MessageRatingValue = {
  Liked: 'liked',
  Disliked: 'disliked',
  Unselected: 'unselected',
};

export type MessageRatingValue =
  typeof MessageRatingValue[keyof typeof MessageRatingValue];

export interface MessageRatingProps
  extends HTMLElementProps<'div'>,
    DarkModeProps {
  /**
   * Custom description text
   * @default "How was the response?"
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  description?: string;

  /**
   * Hides the thumbs down button
   * @default false
   */
  hideThumbsDown?: boolean;

  /**
   * Hides the thumbs up button
   * @default false
   */
  hideThumbsUp?: boolean;

  /**
   * Event handler called when the value of the underlying radio inputs are changed
   */
  onChange: React.ChangeEventHandler<HTMLInputElement>;

  /**
   * Determines the currently selected value of the radio buttons.
   * @default undefined
   */
  value?: MessageRatingValue;
}
