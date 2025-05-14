import React from 'react';
import { connect } from 'react-redux';
import type { DocsChatbotState } from '../store/reducer';
import { Chat } from './chat';

type DocsChatbotWorkspacePluginInitialProps = {
  // isOpen: boolean;
};

// https://mongodb.github.io/chatbot/ui
// https://www.mongodb.design/pattern/chat

// This is the chat tab (not the sidebar).
const DocsChatbotWorkspace: React.FunctionComponent<
  DocsChatbotWorkspacePluginInitialProps
> = ({}) => {
  return (
    <>
      <div>
        <div>docs chatbot tab</div>
        <Chat />
      </div>
    </>
  );
};

export default connect((state: DocsChatbotState) => {
  return {};
})(DocsChatbotWorkspace);
