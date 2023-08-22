import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import AISignInModal from './ai-signin-modal';
import { getStore } from '../store/atlas-signin-store';
import { restoreSignInState } from '../store/atlas-signin-reducer';

function Modal() {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(restoreSignInState() as any);
  }, [dispatch]);
  return <AISignInModal></AISignInModal>;
}

export const AtlasSignIn = () => {
  return (
    <Provider store={getStore()}>
      <Modal></Modal>
    </Provider>
  );
};
