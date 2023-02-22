import React, { useContext, useEffect, useRef, useState } from 'react';

import {
  default as ConfirmationModal,
  Variant as ModalVariant,
} from '@leafygreen-ui/confirmation-modal';

export { ModalVariant };

type ConfirmationProperties = {
  title: string;
  description: string;
  buttonText?: string;
  variant?: ModalVariant;
};
type ConfirmationCallback = (value: boolean) => void;

interface ConfirmationModalContextData {
  showConfirmation: (
    props: ConfirmationProperties,
    callback: ConfirmationCallback
  ) => void;
}

const ConfirmationModalContext =
  React.createContext<ConfirmationModalContextData>(
    {} as ConfirmationModalContextData
  );

class ShowConfirmationEvent extends Event {
  constructor(
    public props: ConfirmationProperties,
    public callback: ConfirmationCallback
  ) {
    super('show');
  }
}
class GlobalConfirmation extends EventTarget {
  showConfirmation(props: ConfirmationProperties) {
    return new Promise<boolean>((resolve) => {
      const event = new ShowConfirmationEvent(props, resolve);
      this.dispatchEvent(event);
    });
  }
}
const globalConfirmation = new GlobalConfirmation();
export const showConfirmation =
  globalConfirmation.showConfirmation.bind(globalConfirmation);

type ConfirmationModalAreaProps = ConfirmationProperties & {
  open: boolean;
};

export const ConfirmationModalArea: React.FC = ({ children }) => {
  const [confirmationProps, setConfirmationProps] = useState({
    open: false,
  } as ConfirmationModalAreaProps);
  const callbackRef = useRef<(value: boolean) => void>();

  useEffect(() => {
    return () => {
      callbackRef.current?.(false);
    };
  }, []);

  // Event listener to use confirmation modal outside of react
  useEffect(() => {
    const listener = ({ props, callback }: ShowConfirmationEvent) => {
      showConfirmation(props, callback);
    };
    globalConfirmation.addEventListener('show', listener);
    return () => {
      globalConfirmation.removeEventListener('show', listener);
    };
  }, []);

  const showConfirmation = (
    props: ConfirmationProperties,
    callback: ConfirmationCallback
  ) => {
    if (confirmationProps.open) {
      throw new Error('Confirmation modal is already open');
    }
    setConfirmationProps({ open: true, ...props });
    callbackRef.current = callback;
  };

  const handleConfirm = () => {
    onUserAction(true);
  };

  const handleCancel = () => {
    onUserAction(false);
  };

  const onUserAction = (value: boolean) => {
    setConfirmationProps((state) => ({ ...state, open: false }));
    callbackRef.current?.(value);
    callbackRef.current = undefined;
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationModal
        open={confirmationProps.open}
        title={confirmationProps.title}
        variant={confirmationProps.variant ?? ModalVariant.Default}
        buttonText={confirmationProps.buttonText ?? 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {confirmationProps.description}
      </ConfirmationModal>
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => {
  const { showConfirmation } = useContext(ConfirmationModalContext);
  return (props: ConfirmationProperties) => {
    return new Promise<boolean>((resolve) => showConfirmation(props, resolve));
  };
};
