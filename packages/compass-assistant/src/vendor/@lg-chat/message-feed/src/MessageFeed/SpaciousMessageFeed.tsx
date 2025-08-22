import React, { forwardRef } from 'react';
import flattenChildren from 'react-keyed-flatten-children';
import { useLeafyGreenChatContext } from '@lg-chat/leafygreen-chat-provider';

import { isComponentType } from '@mongodb-js/compass-components';
import { breakpoints } from '@mongodb-js/compass-components';

import { type MessageFeedProps } from './MessageFeed.types';
import {
  disclaimerTextStyles,
  getAvatarPaddingStyles,
  getContainerStyles,
} from './SpaciousMessageFeed.styles';

export const SpaciousMessageFeed = forwardRef<HTMLDivElement, MessageFeedProps>(
  ({ children, className, ...rest }, fwdRef) => {
    const { containerWidth: chatContainerWidth } = useLeafyGreenChatContext();

    const isDesktop =
      !!chatContainerWidth && chatContainerWidth >= breakpoints.Tablet;

    const flattenedChildren = flattenChildren(children);
    const renderedChildren = flattenedChildren.map((child) => {
      if (isComponentType(child, 'DisclaimerText')) {
        return (
          <div className={disclaimerTextStyles} key="disclaimer-text">
            {child}
          </div>
        );
      } else if (isComponentType(child, 'MessagePrompts')) {
        return (
          <div
            key="message-prompts"
            className={getAvatarPaddingStyles(isDesktop)}
          >
            {child}
          </div>
        );
      } else {
        return child;
      }
    });

    return (
      <div className={getContainerStyles(className)} ref={fwdRef} {...rest}>
        {renderedChildren}
      </div>
    );
  }
);

SpaciousMessageFeed.displayName = 'SpaciousMessageFeed';
