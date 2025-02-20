import React from 'react';
import AISignInModal from './ai-signin-modal';
import AIOptInModal from './ai-optin-modal';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

export interface AtlasAiPluginProps {
  projectId?: string;
}

export const AtlasAiPlugin: React.FunctionComponent<AtlasAiPluginProps> = ({
  projectId,
}) => {
  return (
    <ConfirmationModalArea>
      <AISignInModal></AISignInModal>
      <AIOptInModal projectId={projectId}></AIOptInModal>
    </ConfirmationModalArea>
  );
};
