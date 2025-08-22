import React, { forwardRef } from 'react';
import flattenChildren from 'react-keyed-flatten-children';
import { useLeafyGreenChatContext } from '@lg-chat/leafygreen-chat-provider';

import { shim_lib } from '@mongodb-js/compass-components';
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
      if (shim_lib.isComponentType(child, 'DisclaimerText')) {
        return (
          <div className={disclaimerTextStyles} key="disclaimer-text">
            {child}
          </div>
        );
      } else if (shim_lib.isComponentType(child, 'MessagePrompts')) {
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
