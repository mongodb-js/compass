import React from 'react';
import AISignInModal from './ai-signin-modal';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

export const AtlasSignIn = () => {
  return (
    <ConfirmationModalArea>
      <AISignInModal></AISignInModal>
    </ConfirmationModalArea>
  );
};
