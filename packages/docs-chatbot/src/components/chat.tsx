import React, { useEffect, useState } from 'react';
import {
  Button,
  css,
  cx,
  ErrorSummary,
  Icon,
  MongoDBLogo,
  MongoDBLogoMark,
  spacing,
  SpinLoader,
} from '@mongodb-js/compass-components';
import { connect } from 'react-redux';
import { ObjectId } from 'bson';

import {
  TitleBar,
  MessageFeed,
  ChatWindow,
  InputBar,
  Message,
} from './lg-chat-wrapper';
import type { ChatMessage } from '@mongodb-js/compass-components';

import { loadNewChat, submitMessage } from '../store/chat';
// import { connect } from '../store/context';
import type { DocsChatbotState } from '../store/reducer';
import { closeSidebarChat } from '../store/sidebar-chat';

const chatContainerStyles = css({
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
});

const userMessageSmallStyles = css({
  '> div': {
    maxWidth: '420px',
  },
});

const chatWindowStyles = css({
  width: '100%',
  height: '100%',
  overflow: 'auto',
  display: 'flex',
  flexDirection: 'column',

  background:
    'linear-gradient(#F9FBFA 30%, #F9FBFA 0%) center top, linear-gradient(#F9FBFA 0%, #F9FBFA 30%) center bottom, radial-gradient(farthest-side at 50% 0, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0)) center top, radial-gradient(farthest-side at 50% 100%, rgba(0, 0, 0, 0.1), rgba(0, 0, 0, 0)) center bottom',
  backgroundRepeat: 'no-repeat',
});

const messageAreaContainerStyles = css({
  // So that the input area doesn't jump after loading
  // minHeight: '500px',
  flexGrow: 1,
  overflow: 'auto',
});

const messageFeedStyles = css({
  // Default minHeight is 500px, we add some so that other places in Compass are consistent.
  // minHeight: '560px',
  height: '100%',
});

const messageFeedLargeStyles = css({
  '> div': {
    maxWidth: '1300px',
  },
});

const messageFeedSmallStyles = css({
  '> div': {
    padding: spacing[200],
    // padding: spacing[100],
    // paddingLeft: spacing[200],
    paddingRight: spacing[200],
  },
});

const inputBarContainerStyles = css({
  padding: spacing[300],
  paddingLeft: spacing[200],
  paddingRight: spacing[200],
  // paddingBottom
});

const inputBarContainerLargeStyles = css({
  paddingLeft: spacing[600],
  paddingRight: spacing[600],
  // padding: spacing[600],
  // paddingTop: spacing[300],
  // paddingBottom: spacing[300],
  // paddingLeft: spacing[100],
  // paddingRight: spacing[100],
  // paddingBottom
});

const inputBarStyles = css({
  // marginLeft: spacing[100],
  // marginRight: spacing[100],
});

// Chat component that both the sidebar and the tab use.
function _Chat({
  // allowClose = false,
  hasLoaded,
  isLoading,
  loadingError,
  messagingError,
  size,
  isMessaging,
  messages,
  onSendMessage,
  onLoadChat,
}: // onCloseChat
{
  // allowClose?: boolean;
  hasLoaded: boolean;
  size: 'small' | 'large';
  isLoading: boolean;
  loadingError: Error | null;
  messagingError: Error | null;
  isMessaging: boolean;
  messages: ChatMessage[];
  onSendMessage: (message: string) => Promise<void>;
  onLoadChat: () => Promise<string | undefined>;
  // onCloseChat?: () => void;
}) {
  // const suggestedPrompts = [
  //   'How do I create a new MongoDB Atlas cluster?',
  //   'Can MongoDB store lists of data?',
  //   'How does vector search work?',
  // ];

  // useEffect(() => {
  //   // TODO: This really should be in the reducer.
  //   // Along with opening/closing
  //   if (!isLoading && !hasLoaded) {
  //     void onLoadChat();
  //   }
  //   // void onLoadChat();
  // }, [isLoading, hasLoaded, onLoadChat]);

  if (loadingError) {
    return <ErrorSummary errors={loadingError.message} />;
  }

  return (
    <div className={chatContainerStyles}>
      <div className={chatWindowStyles}>
        {/* <TitleBar title="LG Chat Demo" badgeText="Beta" /> */}
        <TitleBar title="MongoDB Chat" iconSlot={<Icon glyph="Sparkle" />} />
        <div className={messageAreaContainerStyles}>
          {isLoading ? (
            <SpinLoader title="Loading…" />
          ) : (
            <MessageFeed
              className={cx(
                messageFeedStyles,
                size === 'small' && messageFeedSmallStyles,
                size === 'large' && messageFeedLargeStyles
              )}
            >
              {(!messages || messages.length === 0) && (
                <div>
                  {/* Ask me anything! */}

                  {/* Welcome to MongoDB AI */}
                  <Message
                    isSender={false}
                    messageBody="Welcome to MongoDB AI                                                                                                              "
                    links={[
                      {
                        children: 'MongoDB Documentation',
                        href: 'https://www.mongodb.com/docs/',
                        variant: 'Docs',
                      },
                      {
                        children: 'MongoDB Atlas',
                        href: 'https://cloud.mongodb.com/',
                        variant: 'Website',
                      },
                    ]}
                    avatar={<MongoDBLogoMark />}
                    linksHeading=""
                  />
                </div>
              )}
              {messages.map(
                ({
                  content,
                  role,
                  id,
                  // links
                }) => (
                  // <MyMessage key={messageFields.id} {...messageFields} />
                  <Message
                    className={cx(
                      role === 'user' &&
                        size === 'small' &&
                        userMessageSmallStyles
                    )}
                    key={id}
                    isSender={role === 'user'}
                    // markdownProps={LGMarkdownProps}
                    // {...messageFields}

                    // sourceType={role === 'user' ? 'text' : 'markdown'}
                    sourceType={role === 'user' ? 'text' : 'markdown'}
                    // note: markdown
                    messageBody={content}
                    // links={links}
                  />
                )
              )}
            </MessageFeed>
          )}
        </div>
        {messagingError && <ErrorSummary errors={messagingError.message} />}
        {/* {isMessaging && <SpinLoader
          title="Messaging…"
        />} */}
        <div
          className={cx(
            inputBarContainerStyles,
            size === 'large' && inputBarContainerLargeStyles
          )}
        >
          <InputBar
            className={inputBarStyles}
            onMessageSend={(message: string) => void onSendMessage(message)}
          />
        </div>
      </div>
    </div>
  );
}

export const Chat = connect(
  (state: DocsChatbotState) => {
    return {
      hasLoaded: !!state.chat.conversationId,
      messages: state.chat.messages,
      loadingError: state.chat.loadingError,
      messagingError: state.chat.messagingError,
      isLoading: state.chat.isLoading,
      isMessaging: state.chat.isMessaging,
    };
  },
  {
    onSendMessage: (message: string) =>
      submitMessage({
        content: message,
        id: new ObjectId().toHexString(),
        role: 'user',
      }),
    onLoadChat: loadNewChat,
    // onCloseChat: closeSidebarChat
  }
)(_Chat);
