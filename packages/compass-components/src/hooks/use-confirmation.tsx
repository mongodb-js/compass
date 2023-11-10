import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  default as ConfirmationModal,
  Variant as ConfirmationModalVariant,
} from '@leafygreen-ui/confirmation-modal';

export { ConfirmationModalVariant };

type ConfirmationModalProps = React.ComponentProps<typeof ConfirmationModal>;

type ConfirmationProperties = Partial<
  Pick<
    ConfirmationModalProps,
    'title' | 'buttonText' | 'variant' | 'requiredInputText'
  >
> & {
  description?: React.ReactNode;
  'data-testid'?: string;
};

type ConfirmationCallback = (value: boolean) => void;

interface ConfirmationModalContextData {
  showConfirmation: (props: ConfirmationProperties) => Promise<boolean>;
  isMounted: boolean;
}

type ShowConfirmationEventDetail = {
  props: ConfirmationProperties;
  callback: ConfirmationCallback;
};

interface ConfirmationEventMap {
  'show-confirmation': CustomEvent<ShowConfirmationEventDetail>;
}

interface GlobalConfirmation extends EventTarget {
  addEventListener<K extends keyof ConfirmationEventMap>(
    type: K,
    listener: (this: GlobalConfirmation, ev: ConfirmationEventMap[K]) => void
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
  removeEventListener<K extends keyof ConfirmationEventMap>(
    type: K,
    listener: (this: GlobalConfirmation, ev: ConfirmationEventMap[K]) => void
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
}

class GlobalConfirmation extends EventTarget {
  showConfirmation(props: ConfirmationProperties) {
    return new Promise<boolean>((resolve) => {
      this.dispatchEvent(
        new CustomEvent('show-confirmation', {
          detail: { props, callback: resolve },
        })
      );
    });
  }
}
const globalConfirmation = new GlobalConfirmation();
export const showConfirmation =
  globalConfirmation.showConfirmation.bind(globalConfirmation);

const ConfirmationModalContext =
  React.createContext<ConfirmationModalContextData>({
    isMounted: false,
    showConfirmation,
  });

type ConfirmationModalAreaProps = Partial<ConfirmationProperties> & {
  open: boolean;
};

export const ConfirmationModalArea: React.FC = ({ children }) => {
  const hasParentContext = useContext(ConfirmationModalContext).isMounted;

  const [confirmationProps, setConfirmationProps] =
    useState<ConfirmationModalAreaProps>({
      open: false,
    });
  const callbackRef = useRef<ConfirmationCallback>();

  const contextValue = React.useMemo(
    () => ({ showConfirmation, isMounted: true }),
    []
  );

  useEffect(() => {
    return () => {
      callbackRef.current?.(false);
    };
  }, []);

  // Event listener to use confirmation modal outside of react
  useEffect(() => {
    const listener = ({
      detail: { callback, props },
    }: CustomEvent<ShowConfirmationEventDetail>) => {
      setConfirmationProps({ open: true, ...props });
      callbackRef.current = callback;
    };
    globalConfirmation.addEventListener('show-confirmation', listener);
    return () => {
      globalConfirmation.removeEventListener('show-confirmation', listener);
    };
  }, []);

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

  if (hasParentContext) {
    return <>{children}</>;
  }

  return (
    <ConfirmationModalContext.Provider value={contextValue}>
      {children}
      <ConfirmationModal
        data-testid={confirmationProps['data-testid'] ?? 'confirmation-modal'}
        open={confirmationProps.open}
        title={confirmationProps.title ?? 'Are you sure?'}
        variant={confirmationProps.variant ?? ConfirmationModalVariant.Default}
        buttonText={confirmationProps.buttonText ?? 'Confirm'}
        requiredInputText={confirmationProps.requiredInputText ?? undefined}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      >
        {confirmationProps.description}
      </ConfirmationModal>
    </ConfirmationModalContext.Provider>
  );
};

export const useConfirmationModal = () => {
  const { isMounted, showConfirmation } = useContext(ConfirmationModalContext);
  if (!isMounted) {
    throw new Error(
      'useConfirmationModal must be used within a ConfirmationModalArea'
    );
  }
  return { showConfirmation };
};
