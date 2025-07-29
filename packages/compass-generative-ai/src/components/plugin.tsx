import React from 'react';
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
      <AIOptInModal projectId={projectId}></AIOptInModal>
    </ConfirmationModalArea>
  );
};
