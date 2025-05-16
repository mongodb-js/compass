import React from 'react';
import { connect } from 'react-redux';
import { Button, css } from '@mongodb-js/compass-components';

// import { connect } from '../store/context';
// import type { DocsChatbotState } from '../store/reducer';
import { Chat } from './chat';
// import { closeSidebarChat, openSidebarChat } from '../store/sidebar-chat';

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
  // onOpenSidebarChat: () => void;
  // onCloseSidebarChat: () => void;
  setOpen: (isOpen: boolean) => void;
};

// https://mongodb.github.io/chatbot/ui
// https://www.mongodb.design/pattern/chat

const DocsChatbotSidebar: React.FunctionComponent<
  DocsChatbotSidebarPluginInitialProps
> = ({
  isOpen,
  // onOpenSidebarChat,
  // onCloseSidebarChat,
  setOpen,
}) => {
  if (!isOpen) {
    return null;
  }

  // if (!isOpen) {
  //   return (
  //     <div className={closedContainerStyles}>
  //       <Button variant="primary" onClick={() => setOpen(true)}>
  //         Open
  //       </Button>
  //     </div>
  //   );
  // }

  return (
    <div className={openContainerStyles}>
      <Button onClick={() => setOpen(false)}>Close</Button>
      <br />
      <div>~docs chatbot sidebar~</div>
      <Chat />
    </div>
  );
};

export default connect(
  () =>
    // state: DocsChatbotState
    {
      return {
        // isOpen: state.sidebarChat.isOpen,
      };
    },
  {
    // onCloseSidebarChat: closeSidebarChat,
    // onOpenSidebarChat: openSidebarChat,
  }
)(DocsChatbotSidebar);
