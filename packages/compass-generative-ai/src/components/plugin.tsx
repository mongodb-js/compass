import React from 'react';
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
      <AIOptInModal
        isCloudOptIn={isCloudOptIn}
        projectId={projectId}
      ></AIOptInModal>
    </ConfirmationModalArea>
  );
};
