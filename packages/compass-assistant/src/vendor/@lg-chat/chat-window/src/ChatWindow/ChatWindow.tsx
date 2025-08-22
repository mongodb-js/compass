import React, { ForwardedRef, forwardRef } from 'react';
import {
  LeafyGreenChatProvider,
  useLeafyGreenChatContext,
} from '../../../leafygreen-chat-provider/src/index';

import { ChatWindowContents } from './ChatWindowContents';
import { ChatWindowProps } from '.';

export const ChatWindow = forwardRef(
  (
    { children, ...rest }: ChatWindowProps,
    ref: ForwardedRef<HTMLDivElement>
  ) => {
    const { variant } = useLeafyGreenChatContext();

    return (
      <LeafyGreenChatProvider variant={variant}>
        <ChatWindowContents {...rest} ref={ref}>
          {children}
        </ChatWindowContents>
      </LeafyGreenChatProvider>
    );
  }
);

ChatWindow.displayName = 'ChatWindow';
