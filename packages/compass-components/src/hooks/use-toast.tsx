import React, { createContext, useCallback, useContext, useState } from 'react';
import type { ToastVariant } from '..';
import { css } from '..';
import { Toast } from '..';

type ToastProperties = {
  title?: React.ReactNode;
  body: React.ReactNode;
  variant: ToastVariant;
  progress?: number;
  timeout?: number;
};

type ToastState = ToastProperties & {
  timeoutRef?: ReturnType<typeof setTimeout>;
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
 *   return <button onClick={() => openToast(
 *      'myToast1', {title: 'This is a notification'})} />
 * };
 *
 * <ToastArea><MyButton/><ToastArea>
 * ```
 *
 * @returns
 */
export const ToastArea = ({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement => {
  const [toasts, setToasts] = useState<Record<string, ToastState>>({});

  const closeToast = useCallback(
    (toastId: string): void => {
      const { timeoutRef } = toasts[toastId] || {};
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      setToasts((prevToasts) => {
        const newToasts = { ...prevToasts };
        delete newToasts[toastId];
        return newToasts;
      });
    },
    [toasts, setToasts]
  );

  const openToast = useCallback(
    (toastId: string, toastProperties: ToastProperties): void => {
      // if updating clear timeouts first
      const { timeoutRef } = toasts[toastId] || {};
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      setToasts((prevToasts) => ({
        ...prevToasts,
        [toastId]: {
          ...toastProperties,
          timeoutRef: toastProperties.timeout
            ? setTimeout(() => {
                closeToast(toastId);
              }, toastProperties.timeout)
            : undefined,
        },
      }));
    },
    [toasts, setToasts, closeToast]
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
