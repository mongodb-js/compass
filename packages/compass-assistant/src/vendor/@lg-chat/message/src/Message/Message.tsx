import React, { forwardRef, useMemo } from 'react';
import {
  useLeafyGreenChatContext,
  Variant,
} from '@lg-chat/leafygreen-chat-provider';

import LeafyGreenProvider, {
  useDarkMode,
} from '@mongodb-js/compass-components';
import { consoleOnce } from '@mongodb-js/compass-components';

import { MessageContext } from '../MessageContext';

import { CompactMessage } from './CompactMessage';
import { type MessageProps } from './Message.types';
import { SpaciousMessage } from './SpaciousMessage';

export const Message = forwardRef<HTMLDivElement, MessageProps>(
  (
    {
      align,
      avatar,
      baseFontSize,
      children,
      componentOverrides,
      darkMode: darkModeProp,
      links,
      linksHeading,
      onLinkClick,
      verified,
      ...rest
    },
    fwdRef
  ) => {
    const { darkMode } = useDarkMode(darkModeProp);
    const { variant } = useLeafyGreenChatContext();
    const isCompact = variant === Variant.Compact;

    if (
      isCompact &&
      (align ||
        avatar ||
        baseFontSize ||
        componentOverrides ||
        links ||
        linksHeading ||
        onLinkClick ||
        verified)
    ) {
      consoleOnce.warn(
        `@lg-chat/message: The Message component's props 'align', 'avatar', 'baseFontSize', 'componentOverrides', 'links', 'linksHeading', 'onLinkClick', and 'verified' are only used in the 'spacious' variant. They will not be rendered in the 'compact' variant set by the provider.`
      );
    }

    const contextValue = useMemo(
      () => ({
        messageBody: rest.messageBody,
      }),
      [rest.messageBody]
    );

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        <MessageContext.Provider value={contextValue}>
          {isCompact ? (
            <CompactMessage ref={fwdRef} {...rest}>
              {children}
            </CompactMessage>
          ) : (
            <SpaciousMessage
              align={align}
              avatar={avatar}
              baseFontSize={baseFontSize}
              componentOverrides={componentOverrides}
              links={links}
              linksHeading={linksHeading}
              onLinkClick={onLinkClick}
              ref={fwdRef}
              verified={verified}
              {...rest}
            >
              {children}
            </SpaciousMessage>
          )}
        </MessageContext.Provider>
      </LeafyGreenProvider>
    );
  }
);

Message.displayName = 'Message';
