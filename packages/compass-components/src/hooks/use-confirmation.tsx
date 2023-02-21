import React, { useContext, useEffect, useState } from 'react';

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

interface ConfirmationModalContextData {
  showConfirmation: (props: ConfirmationProperties) => Promise<boolean>;
}

const ConfirmationModalContext =
  React.createContext<ConfirmationModalContextData>(
    {} as ConfirmationModalContextData
  );

class ShowConfirmationEvent extends Event {
  constructor(
    public props: ConfirmationProperties,
    public callback: (value: boolean) => void = () => {}
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

export const ConfirmationModalArea: React.FC = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState({} as ConfirmationProperties);
  const [callback, setCallback] = useState<(value: boolean) => void>(() => {});

  useEffect(() => {
    return () => {
      setIsOpen(false);
      setData({} as ConfirmationProperties);
      setCallback(() => {});
    };
  }, []);

  // Event listener to use confirmation modal outside of react
  useEffect(() => {
    const listener = (event: ShowConfirmationEvent) => {
      showConfirmation(event.props).then(event.callback);
    };

    globalConfirmation.addEventListener('show', listener);

    return () => {
      globalConfirmation.removeEventListener('show', listener);
    };
  }, []);

  const showConfirmation = (props: ConfirmationProperties) => {
    return new Promise<boolean>((resolve, reject) => {
      if (isOpen) {
        reject(new Error('Confirmation modal is already open'));
      } else {
        setData(props);
        setIsOpen(true);
        setCallback(() => resolve);
      }
    });
  };

  const handleConfirm = () => {
    setIsOpen(false);
    callback(true);
  };

  const handleCancel = () => {
    setIsOpen(false);
    callback(false);
  };

  return (
    <ConfirmationModalContext.Provider value={{ showConfirmation }}>
      {children}
      <ConfirmationModal
        open={isOpen}
        title={data.title}
        variant={data.variant ?? ModalVariant.Default}
        buttonText={data.buttonText ?? 'Confirm'}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {data.description}
      </ConfirmationModal>
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => {
  const { showConfirmation } = useContext(ConfirmationModalContext);
  return showConfirmation;
};
