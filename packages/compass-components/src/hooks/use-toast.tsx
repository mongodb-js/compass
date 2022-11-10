import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

import { ToastVariant, Toast } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';

export { ToastVariant };

type ToastProperties = {
  title?: React.ReactNode;
  body: React.ReactNode;
  variant: ToastVariant;
  progress?: number;
  timeout?: number;
};

interface ToastActions {
  openToast: (id: string, toastProperties: ToastProperties) => void;
  closeToast: (id: string) => void;
}

const ToastContext = createContext<ToastActions>({
  openToast: () => {
    //
  },
  closeToast: () => {
    //
  },
});

const toastStyles = css({
  button: {
    position: 'absolute',
  },
});

/**
 * @example
 *
 * ```
 * const MyButton = () => {
 *   const { openToast } = useToast('namespace');
 *   return <button type="button" onClick={() => openToast(
 *      'myToast1', {title: 'This is a notification'})} />
 * };
 *
 * <ToastArea><MyButton/><ToastArea>
 * ```
 *
 * @returns
 */
export const ToastArea: React.FunctionComponent = ({ children }) => {
  const [toasts, setToasts] = useState<Record<string, ToastProperties>>({});
  const timeouts = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  useEffect(() => {
    return () => {
      Object.values(timeouts).forEach(clearTimeout);
    };
  }, [timeouts]);

  const clearTimeoutRef = useCallback(
    (id) => {
      clearTimeout(timeouts.current[id]);
      delete timeouts.current[id];
    },
    [timeouts]
  );

  const setTimeoutRef = useCallback(
    (id: string, callback: () => void, timeout: number) => {
      clearTimeoutRef(id);
      timeouts.current[id] = setTimeout(callback, timeout);
    },
    [timeouts, clearTimeoutRef]
  );

  const closeToast = useCallback(
    (toastId: string): void => {
      clearTimeoutRef(toastId);

      setToasts((prevToasts) => {
        const newToasts = { ...prevToasts };
        delete newToasts[toastId];
        return newToasts;
      });
    },
    [setToasts, clearTimeoutRef]
  );

  const openToast = useCallback(
    (toastId: string, toastProperties: ToastProperties): void => {
      clearTimeoutRef(toastId);

      if (toastProperties.timeout) {
        setTimeoutRef(
          toastId,
          () => {
            closeToast(toastId);
          },
          toastProperties.timeout
        );
      }

      setToasts((prevToasts) => ({
        ...prevToasts,
        [toastId]: {
          ...toastProperties,
        },
      }));
    },
    [setToasts, setTimeoutRef, clearTimeoutRef, closeToast]
  );

  return (
    <ToastContext.Provider value={{ closeToast, openToast }}>
      <>{children}</>
      <>
        {Object.entries(toasts).map(
          ([id, { title, body, variant, progress }]) => (
            <Toast
              className={toastStyles}
              key={id}
              data-testid={`toast-${id}`}
              title={title}
              body={body}
              variant={variant}
              progress={progress}
              open={true}
              close={() => closeToast(id)}
            />
          )
        )}
      </>
    </ToastContext.Provider>
  );
};

export function useToast(namespace: string): ToastActions {
  const { openToast: openGlobalToast, closeToast: closeGlobalToast } =
    useContext(ToastContext);

  const openToast = useCallback(
    (toastId: string, toastProperties: ToastProperties): void => {
      openGlobalToast(`${namespace}--${toastId}`, toastProperties);
    },
    [namespace, openGlobalToast]
  );

  const closeToast = useCallback(
    (toastId: string): void => {
      closeGlobalToast(`${namespace}--${toastId}`);
    },
    [namespace, closeGlobalToast]
  );

  return {
    openToast,
    closeToast,
  };
}
