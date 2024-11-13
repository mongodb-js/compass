import React from 'react';
import AISignInModal from './ai-signin-modal';
import AIOptInModal from './ai-optin-modal';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';


export const AtlasAiPlugin = () => {
  return (
    <ConfirmationModalArea>
      <AISignInModal></AISignInModal>
      <AIOptInModal></AIOptInModal>
    </ConfirmationModalArea>
  );
};