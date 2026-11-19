import React from 'react';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';
import AIOptInModal from './ai-optin-modal';

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
      <AIOptInModal
        isCloudOptIn={isCloudOptIn}
        projectId={projectId}
      ></AIOptInModal>
    </ConfirmationModalArea>
  );
};
