import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Variant as ConfirmationModalVariant } from '@leafygreen-ui/confirmation-modal';
import ConfirmationModal from '../components/modals/confirmation-modal';
import { css } from '@leafygreen-ui/emotion';
import type { ButtonProps } from '@leafygreen-ui/button';

export { ConfirmationModalVariant };

type ConfirmationModalProps = React.ComponentProps<typeof ConfirmationModal>;

type ConfirmationProperties = Partial<
  Pick<ConfirmationModalProps, 'title' | 'variant' | 'requiredInputText'>
> & {
  buttonText?: React.ReactNode;
  confirmButtonProps?: Omit<ButtonProps, 'onClick'>;
  hideConfirmButton?: boolean;
  hideCancelButton?: boolean;
  description?: React.ReactNode;
  signal?: AbortSignal;
  'data-testid'?: string;
};

type ConfirmationCallback = (value: boolean) => void;

type OnShowConfirmationProperties = {
  props: ConfirmationProperties;
  resolve: ConfirmationCallback;
  reject: (err?: any) => void;
  confirmationId: number;
};

interface ConfirmationModalActions {
  showConfirmation: (props: ConfirmationProperties) => Promise<boolean>;
}
class GlobalConfirmationModalState implements ConfirmationModalActions {
  private confirmationId = 0;
  onShowCallback: ((props: OnShowConfirmationProperties) => void) | null = null;
  showConfirmation(props: ConfirmationProperties) {
    return new Promise<boolean>((resolve, reject) => {
      this.onShowCallback?.({
        props,
        resolve,
        reject,
        confirmationId: ++this.confirmationId,
      });
    });
  }
}

const confirmationModalState = new GlobalConfirmationModalState();

export const showConfirmation = confirmationModalState.showConfirmation.bind(
  confirmationModalState
);

export const showConfirmationModal = showConfirmation;

const hideButtonStyles = css({
  display: 'none !important',
});

const _ConfirmationModalArea: React.FunctionComponent = ({ children }) => {
  const [confirmationProps, setConfirmationProps] = useState<
    Partial<ConfirmationProperties> & { open: boolean; confirmationId: number }
  >({
    open: false,
    confirmationId: -1,
  });
  const callbackRef = useRef<ConfirmationCallback>();
  const confirmationModalStateRef = useRef<GlobalConfirmationModalState>();

  if (!confirmationModalStateRef.current) {
    confirmationModalStateRef.current = confirmationModalState;
    confirmationModalStateRef.current.onShowCallback = ({
      props,
      resolve,
      reject,
      confirmationId,
    }) => {
      setConfirmationProps({ open: true, confirmationId, ...props });
      const onAbort = () => {
        setConfirmationProps((state) => {
          return { ...state, open: false };
        });
        reject(props.signal?.reason);
      };
      callbackRef.current = (confirmed) => {
        props.signal?.removeEventListener('abort', onAbort);
        resolve(confirmed);
      };
      props.signal?.addEventListener('abort', onAbort);
    };
  }

  useEffect(() => {
    return () => {
      callbackRef.current?.(false);
      if (confirmationModalStateRef.current) {
        confirmationModalStateRef.current.onShowCallback = null;
      }
    };
  }, []);

  const onUserAction = useCallback((value: boolean) => {
    setConfirmationProps((state) => {
      return { ...state, open: false };
    });
    callbackRef.current?.(value);
    callbackRef.current = undefined;
  }, []);

  const handleConfirm = useCallback(() => {
    onUserAction(true);
  }, [onUserAction]);

  const handleCancel = useCallback(() => {
    onUserAction(false);
  }, [onUserAction]);

  return (
    <>
      {children}
      <ConfirmationModal
        // To make sure that confirmation modal internal state is reset for
        // every confirmation request triggered with showConfirmation method we
        // pass `confirmationId` as a component key to force React to remount it
        // when request starts
        key={confirmationProps.confirmationId}
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
          ...confirmationProps.confirmButtonProps,
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
    </>
  );
};

const ConfirmationModalAreaMountedContext = React.createContext(false);

export const ConfirmationModalArea: React.FunctionComponent = ({
  children,
}) => {
  if (useContext(ConfirmationModalAreaMountedContext)) {
    return <>{children}</>;
  }

  return (
    <ConfirmationModalAreaMountedContext.Provider value={true}>
      <_ConfirmationModalArea>{children}</_ConfirmationModalArea>
    </ConfirmationModalAreaMountedContext.Provider>
  );
};
