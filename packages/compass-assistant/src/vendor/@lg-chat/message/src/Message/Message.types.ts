import { ReactElement } from 'react';
import { type RichLinkProps } from '@lg-chat/rich-links';

import {
  type DarkModeProps,
  type HTMLElementProps,
} from '@mongodb-js/compass-components';
import { BaseFontSize } from '@mongodb-js/compass-components';

import { type MessageContainerProps } from '../MessageContainer';
import { type MessageContentProps } from '../MessageContent';
import { type MessageLinksProps } from '../MessageLinks';

export const Align = {
  Right: 'right',
  Left: 'left',
} as const;

export type Align = typeof Align[keyof typeof Align];

export interface ComponentOverrides {
  MessageContainer?: (props: MessageContainerProps) => JSX.Element;
  MessageContent?: (props: MessageContentProps) => JSX.Element;
  MessageLinks?: (props: MessageLinksProps) => JSX.Element;
}

export interface MessageProps
  extends Omit<MessageContentProps, 'children'>,
    HTMLElementProps<'div'>,
    DarkModeProps {
  /**
   * Determines whether the message is aligned to the left or right
   *
   * By default, if `isSender === true`, the message is aligned to the right, and otherwise to the left. This prop overrides that behavior.
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  align?: Align;

  /**
   * Avatar element
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  avatar?: ReactElement;

  /**
   * Base font size
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  baseFontSize?: BaseFontSize;

  /**
   * Component overrides for any subcomponents
   * @deprecated
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  componentOverrides?: ComponentOverrides;

  /**
   * Indicates if the message is from the current user
   * @default true
   */
  isSender?: boolean;

  /**
   * A list of links to render as rich links for the message.
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  links?: Array<RichLinkProps>;

  /**
   * The heading text to display for the links section.
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  linksHeading?: string;

  /**
   * Message body text passed to LGMarkdown
   */
  messageBody?: string;

  /**
   * A callback function that is called when any link is clicked.
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  onLinkClick?: RichLinkProps['onLinkClick'];

  /**
   * Configure a *verified message* which includes additional styles and
   * displays information about the message.
   * @remarks This prop is only considered when the parent `LeafyGreenChatProvider` has `variant="spacious"`.
   */
  verified?: VerificationInfo;
}

export interface VerificationInfo {
  /**
   * URL to learn more about the verification.
   */
  learnMoreUrl?: string;

  /**
   * The time the message was last verified.
   * @example new Date("2024-03-24T16:20:00Z")
   */
  verifiedAt?: Date;

  /**
   * The name of the entity that verified the message.
   * @example "MongoDB Staff"
   */
  verifier?: string;
}
