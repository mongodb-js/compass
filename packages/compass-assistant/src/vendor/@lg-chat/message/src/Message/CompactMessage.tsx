import React, { forwardRef } from 'react';
import { useLeafyGreenChatContext } from '@lg-chat/leafygreen-chat-provider';

import { shim_useDarkMode } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { BaseFontSize } = shim_tokens;
import { Body } from '@mongodb-js/compass-components';

import {
  MessageContainer,
  Variant as MessageContainerVariant,
} from '../MessageContainer';
import { MessageContent } from '../MessageContent';

import {
  avatarContainerStyles,
  getContainerStyles,
} from './CompactMessage.styles';
import { type MessageProps } from './Message.types';
import { AssistantAvatar } from '@vendor-leafygreen-ui/avatar';

export const CompactMessage = forwardRef<HTMLDivElement, MessageProps>(
  (
    {
      children,
      className,
      isSender = true,
      markdownProps,
      messageBody,
      sourceType,
      ...rest
    },
    fwdRef
  ) => {
    const { theme, darkMode } = shim_useDarkMode();
    const { assistantName } = useLeafyGreenChatContext();

    return (
      <div
        className={getContainerStyles({
          className,
          isSender,
          theme,
        })}
        ref={fwdRef}
        {...rest}
      >
        {!isSender && (
          <div className={avatarContainerStyles}>
            <AssistantAvatar darkMode={darkMode} size={20} />
            <Body weight="medium">{assistantName}</Body>
          </div>
        )}
        <MessageContainer
          variant={
            isSender
              ? MessageContainerVariant.Primary
              : MessageContainerVariant.Secondary
          }
        >
          <MessageContent
            sourceType={sourceType}
            baseFontSize={BaseFontSize.Body1}
            {...markdownProps}
          >
            {messageBody ?? ''}
          </MessageContent>
          {children}
        </MessageContainer>
      </div>
    );
  }
);

CompactMessage.displayName = 'CompactMessage';
