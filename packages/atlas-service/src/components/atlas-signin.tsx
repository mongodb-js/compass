import React, { useEffect, useRef } from 'react';
import { Provider, useDispatch } from 'react-redux';
import AISignInModal from './ai-signin-modal';
import type { AtlasServiceStore } from '../store/atlas-signin-store';
import { getStore } from '../store/atlas-signin-store';
import { restoreSignInState } from '../store/atlas-signin-reducer';
import { ConfirmationModalArea } from '@mongodb-js/compass-components';

export const Modal: React.FunctionComponent<{
  restoreStateOnMount?: boolean;
}> = ({ restoreStateOnMount = true }) => {
  const dispatch = useDispatch<AtlasServiceStore['dispatch']>();
  const restoreStateOnMountRef = useRef(restoreStateOnMount);
  useEffect(() => {
    if (restoreStateOnMountRef.current) {
      void dispatch(restoreSignInState());
    }
  }, [dispatch]);
  return (
    <ConfirmationModalArea>
      <AISignInModal></AISignInModal>
    </ConfirmationModalArea>
  );
};

export const AtlasSignIn = () => {
  return (
    <Provider store={getStore()}>
      <Modal></Modal>
    </Provider>
  );
};
