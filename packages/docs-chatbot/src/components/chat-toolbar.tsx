import React from 'react';
import { connect } from 'react-redux';
import { css, Icon, IconButton, spacing } from '@mongodb-js/compass-components';

import type { DocsChatbotState } from '../store/reducer';
import { loadNewChat } from '../store/chat';

const chatToolbarStyles = css({
  // Hacky just overlaying the lg-chat title.
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,

  display: 'flex',
  alignItems: 'center',
  padding: spacing[200],
  paddingTop: spacing[300],
});

const chatToolbarRightActionsStyles = css({
  display: 'flex',
  alignItems: 'center',
  marginLeft: 'auto',
  gap: spacing[200],
});

const ChatToolbar = ({
  onClose,
  isLoading,
  onNewChat,
}: {
  onClose?: () => void;
  isLoading: boolean;
  onNewChat: () => void;
}) => {
  return (
    <div className={chatToolbarStyles}>
      {onClose && (
        <IconButton
          disabled={isLoading}
          aria-label="Close Chat"
          title="Close Chat"
          onClick={onClose}
        >
          <Icon glyph="X" />
        </IconButton>
      )}
      <div className={chatToolbarRightActionsStyles}>
        <IconButton
          disabled={isLoading}
          aria-label="Chat Settings"
          title="Chat Settings"
          onClick={() => alert('no op')}
        >
          <Icon glyph="Settings" />
        </IconButton>
        <IconButton
          disabled={isLoading}
          aria-label="New Chat"
          title="New Chat"
          onClick={onNewChat}
        >
          <Icon glyph="Plus" />
        </IconButton>
      </div>
    </div>
  );
};

export default connect(
  (state: DocsChatbotState) => {
    return {
      isLoading: state.chat.isLoading,
    };
  },
  {
    onNewChat: loadNewChat,
  }
)(ChatToolbar);
