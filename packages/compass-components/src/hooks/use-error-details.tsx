import React, { useContext, useEffect, useState } from 'react';
import {
  ErrorDetailsModal,
  type ErrorDetailsModalProps,
} from '../components/modals/error-details-modal';

type ErrorDetailsOptions = Omit<ErrorDetailsModalProps, 'onClose'>;

interface ErrorDetailsModalContextData {
  showErrorDetails: (props: ErrorDetailsOptions) => void;
  isMounted: boolean;
}

let errorDetailsId = 0;

interface ErrorDetailsEventMap {
  'show-error-details': CustomEvent<ErrorDetailsOptions>;
}

interface GlobalErrorDetails extends EventTarget {
  addEventListener<K extends keyof ErrorDetailsEventMap>(
    type: K,
    listener: (this: GlobalErrorDetails, ev: ErrorDetailsEventMap[K]) => void
  ): void;
  addEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
  removeEventListener<K extends keyof ErrorDetailsEventMap>(
    type: K,
    listener: (this: GlobalErrorDetails, ev: ErrorDetailsEventMap[K]) => void
  ): void;
  removeEventListener(
    type: string,
    listener: EventListenerOrEventListenerObject
  ): void;
}

type ShowErrorDetailsEventDetail = ErrorDetailsOptions & {
  errorDetailsId: number;
};

class GlobalErrorDetails extends EventTarget {
  showErrorDetails(props: ErrorDetailsOptions) {
    this.dispatchEvent(
      new CustomEvent<ShowErrorDetailsEventDetail>('show-error-details', {
        detail: {
          ...props,
          errorDetailsId: ++errorDetailsId,
        },
      })
    );
  }
}
const globalErrorDetails = new GlobalErrorDetails();

export const showErrorDetails =
  globalErrorDetails.showErrorDetails.bind(globalErrorDetails);

const ErrorDetailsModalContext =
  React.createContext<ErrorDetailsModalContextData>({
    isMounted: false,
    showErrorDetails,
  });

type ErrorDetailsModalAreaProps = Partial<ShowErrorDetailsEventDetail> & {
  open: boolean;
};

export const ErrorDetailsModalArea: React.FC = ({ children }) => {
  const hasParentContext = useContext(ErrorDetailsModalContext).isMounted;

  const [errorDetailsProps, setErrorDetailsProps] =
    useState<ErrorDetailsModalAreaProps>({
      open: false,
      errorDetailsId: -1,
    });

  const contextValue = React.useMemo(
    () => ({
      showErrorDetails: (options: ErrorDetailsOptions) =>
        setErrorDetailsProps({ open: true, ...options }),
      isMounted: true,
    }),
    [setErrorDetailsProps]
  );

  // Event listener to use confirmation modal outside of react
  useEffect(() => {
    const listener = ({ detail }: CustomEvent<ErrorDetailsOptions>) => {
      setErrorDetailsProps({ open: true, ...detail });
    };
    globalErrorDetails.addEventListener('show-error-details', listener);
    return () => {
      globalErrorDetails.removeEventListener('show-error-details', listener);
    };
  }, []);

  const handleClose = () => {
    setErrorDetailsProps((state: ErrorDetailsModalAreaProps) => ({
      ...state,
      open: false,
    }));
  };

  if (hasParentContext) {
    return <>{children}</>;
  }

  return (
    <ErrorDetailsModalContext.Provider value={contextValue}>
      {children}
      <ErrorDetailsModal
        // To make sure that confirmation modal internal state is reset for
        // every confirmation request triggered with showConfirmation method we
        // pass `errorDetailsId` as a component key to force React to remount it
        // when request starts
        key={errorDetailsId}
        data-testid="import-error-details-modal"
        open={errorDetailsProps.open}
        title={errorDetailsProps.title}
        closeAction={errorDetailsProps.closeAction || 'close'}
        onClose={handleClose}
        details={errorDetailsProps.details}
      />
    </ErrorDetailsModalContext.Provider>
  );
};

export const useErrorDetailsModal = () => {
  const { isMounted, showErrorDetails } = useContext(ErrorDetailsModalContext);
  if (!isMounted) {
    throw new Error(
      'useErrorDetailsModal must be used within a ErrorDetailsModalArea'
    );
  }
  return { showErrorDetails };
};
