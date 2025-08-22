import { LGMarkdownProps } from '@lg-chat/lg-markdown';

import { shim_lib } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';

export const MessageSourceType = {
  Markdown: 'markdown',
  Text: 'text',
} as const;

export type MessageSourceType =
  typeof MessageSourceType[keyof typeof MessageSourceType];

export interface MessageContentProps
  extends Omit<shim_lib.HTMLElementProps<'div'>, 'children'> {
  /**
   * Base font size
   */
  baseFontSize?: shim_tokens.BaseFontSize;

  /**
   * Rendered children; only string children are supported.
   */
  children: string;

  /**
   * Props passed to the internal ReactMarkdown instance
   */
  markdownProps?: Omit<LGMarkdownProps, 'children'>;

  /**
   * Determines the rendering method of the message
   * @default MessageSourceType.Text
   */
  sourceType?: MessageSourceType;
}
