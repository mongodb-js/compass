import React from 'react';
import { connect } from 'react-redux';
import type { DocsChatbotState } from '../store/reducer';
import { Chat } from './chat';
import { Button, css } from '@mongodb-js/compass-components';
import { closeSidebarChat, openSidebarChat } from '../store/sidebar-chat';

const openContainerStyles = css({
  minWidth: '300px',
  height: '100vh',
});

const closedContainerStyles = css({
  width: '100px',
  height: '100vh',
});

type DocsChatbotSidebarPluginInitialProps = {
  isOpen: boolean;
  onOpenSidebarChat: () => void;
  onCloseSidebarChat: () => void;
};

// https://mongodb.github.io/chatbot/ui
// https://www.mongodb.design/pattern/chat

const DocsChatbotSidebar: React.FunctionComponent<
  DocsChatbotSidebarPluginInitialProps
> = ({ isOpen, onOpenSidebarChat, onCloseSidebarChat }) => {
  if (!isOpen) {
    return (
      <div className={closedContainerStyles}>
        <Button variant="primary" onClick={onOpenSidebarChat}>
          Open
        </Button>
      </div>
    );
  }

  return (
    <div className={openContainerStyles}>
      <Button onClick={onCloseSidebarChat}>Close</Button>
      <br />
      <div>~docs chatbot sidebar~</div>
      <Chat />
    </div>
  );
};

export default connect(
  (state: DocsChatbotState) => {
    return {
      isOpen: state.sidebarChat.isOpen,
    };
  },
  {
    onCloseSidebarChat: closeSidebarChat,
    onOpenSidebarChat: openSidebarChat,
  }
)(DocsChatbotSidebar);
