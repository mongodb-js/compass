import React, { useContext, useEffect, useRef, useState } from 'react';
import { Variant as ConfirmationModalVariant } from '@leafygreen-ui/confirmation-modal';
import ConfirmationModal from '../components/modals/confirmation-modal';
import { css } from '@leafygreen-ui/emotion';

export { ConfirmationModalVariant };

type ConfirmationModalProps = React.ComponentProps<typeof ConfirmationModal>;

type ConfirmationProperties = Partial<
  Pick<ConfirmationModalProps, 'title' | 'variant' | 'requiredInputText'>
> & {
  buttonText?: React.ReactNode;
  hideConfirmButton?: boolean;
  hideCancelButton?: boolean;
  description?: React.ReactNode;
  signal?: AbortSignal;
  'data-testid'?: string;
};

type ConfirmationCallback = (value: boolean) => void;

interface ConfirmationModalContextData {
  showConfirmation: (props: ConfirmationProperties) => Promise<boolean>;
  isMounted: boolean;
}

type ShowConfirmationEventDetail = {
  props: ConfirmationProperties & { confirmationId: number };
  resolve: ConfirmationCallback;
  reject: (err?: any) => void;
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

let confirmationId = 0;

class GlobalConfirmation extends EventTarget {
  showConfirmation(props: ConfirmationProperties) {
    return new Promise<boolean>((resolve, reject) => {
      this.dispatchEvent(
        new CustomEvent<ShowConfirmationEventDetail>('show-confirmation', {
          detail: {
            props: { ...props, confirmationId: ++confirmationId },
            resolve,
            reject,
          },
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

type ConfirmationModalAreaProps = Partial<
  ShowConfirmationEventDetail['props']
> & { open: boolean };

const hideButtonStyles = css({
  display: 'none !important',
});

export const ConfirmationModalArea: React.FC = ({ children }) => {
  const hasParentContext = useContext(ConfirmationModalContext).isMounted;

  const [confirmationProps, setConfirmationProps] =
    useState<ConfirmationModalAreaProps>({
      open: false,
      confirmationId: -1,
    });
  const callbackRef = useRef<ConfirmationCallback>();

  const listenerRef =
    useRef<(event: CustomEvent<ShowConfirmationEventDetail>) => void>();

  const contextValue = React.useMemo(
    () => ({
      showConfirmation: (props: ConfirmationProperties) => {
        return new Promise((resolve, reject) => {
          const event = new CustomEvent<ShowConfirmationEventDetail>(
            'show-confirmation',
            {
              detail: {
                props: { ...props, confirmationId: ++confirmationId },
                resolve,
                reject,
              },
            }
          );
          listenerRef.current?.(event);
        });
      },
      isMounted: true,
    }),
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
      detail: { resolve, reject, props },
    }: CustomEvent<ShowConfirmationEventDetail>) => {
      setConfirmationProps({ open: true, ...props });
      const onAbort = () => {
        setConfirmationProps({ open: false, ...props });
        reject(props.signal?.reason);
      };
      callbackRef.current = (confirmed) => {
        props.signal?.removeEventListener('abort', onAbort);
        resolve(confirmed);
      };
      props.signal?.addEventListener('abort', onAbort);
    };
    listenerRef.current = listener;
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
        // To make sure that confirmation modal internal state is reset for
        // every confirmation request triggered with showConfirmation method we
        // pass `confirmationId` as a component key to force React to remount it
        // when request starts
        key={confirmationId}
        data-testid={confirmationProps['data-testid'] ?? 'confirmation-modal'}
        open={confirmationProps.open}
        title={confirmationProps.title ?? 'Are you sure?'}
        variant={confirmationProps.variant ?? ConfirmationModalVariant.Default}
        confirmButtonProps={{
          className: confirmationProps.hideConfirmButton
            ? hideButtonStyles
            : undefined,
          children: confirmationProps.buttonText ?? 'Confirm',
          onClick: handleConfirm,
        }}
        cancelButtonProps={{
          className: confirmationProps.hideCancelButton
            ? hideButtonStyles
            : undefined,
          onClick: handleCancel,
        }}
        requiredInputText={confirmationProps.requiredInputText ?? undefined}
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
