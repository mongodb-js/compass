import React from 'react';
import { connect } from 'react-redux';
import { css, WorkspaceContainer } from '@mongodb-js/compass-components';

// import { connect } from '../store/context';
import type { DocsChatbotState } from '../store/reducer';
import { Chat } from './chat';
import ChatToolbar from './chat-toolbar';

type DocsChatbotWorkspacePluginInitialProps = {
  // isOpen: boolean;
};

const workspaceContainerStyles = css({
  // height: '100vh',
  // Hacky, shouldn't do this.
  height: 'calc(100vh - 40px)',
});

// const tabContainerStyles = css({
//   // width: '100%',
//   // height: '100%',
//   // display: 'flex',

//   position: 'absolute',
//   top: 0,
//   left: 0,
//   right: 0,
//   bottom: 0,
//   display: 'flex',
// })

// https://mongodb.github.io/chatbot/ui
// https://www.mongodb.design/pattern/chat

// This is the chat tab (not the sidebar).
const DocsChatbotWorkspace: React.FunctionComponent<
  DocsChatbotWorkspacePluginInitialProps
> = () => {
  return (
    <WorkspaceContainer
      className={workspaceContainerStyles}
      // toolbar={() => <ChatToolbar />}
    >
      <ChatToolbar />
      {/* <div className={tabContainerStyles}> */}
      {/* <div>docs chatbot tab</div> */}
      <Chat size="large" />
      {/* </div> */}
    </WorkspaceContainer>
  );
};

export default connect((state: DocsChatbotState) => {
  return {};
})(DocsChatbotWorkspace);
