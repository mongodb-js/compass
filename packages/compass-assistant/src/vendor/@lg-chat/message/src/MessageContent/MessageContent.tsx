import React from 'react';
import { LGMarkdown } from '@lg-chat/lg-markdown';

import { MessageContentProps, MessageSourceType } from './MessageContent.types';

export function MessageContent({
  children,
  sourceType,
  baseFontSize,
  markdownProps,
  ...rest
}: MessageContentProps) {
  let renderedChildren: React.ReactNode | null = null;

  switch (sourceType) {
    // setting up a switch/case in anticipation of other sourceTypes being supported in the future
    case MessageSourceType.Markdown:
      renderedChildren = (
        <LGMarkdown baseFontSize={baseFontSize} {...rest} {...markdownProps}>
          {children}
        </LGMarkdown>
      );
      break;
    default:
      renderedChildren = children;
  }

  return <div {...rest}>{renderedChildren}</div>;
}

MessageContent.displayName = 'MessageContent';
