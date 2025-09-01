import React from 'react';
import AISignInModal from './ai-signin-modal';
import AIOptInModal from './ai-optin-modal';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

export interface AtlasAiPluginProps {
  projectId?: string;
  isCloudOptIn: boolean;
}

export const AtlasAiPlugin: React.FunctionComponent<AtlasAiPluginProps> = ({
  projectId,
  isCloudOptIn,
}) => {
  return (
    <ConfirmationModalArea>
      <AISignInModal></AISignInModal>
      <AIOptInModal
        isCloudOptIn={isCloudOptIn}
        projectId={projectId}
      ></AIOptInModal>
    </ConfirmationModalArea>
  );
};
