import React, { createContext, useCallback, useContext, useState } from 'react';
import { css, ToastVariant } from '..';
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

type ToastId = string;

type ToastContextState = {
  toasts: Record<ToastId, ToastState>;
  setToasts: (toasts: Record<ToastId, ToastState>) => void;
};

interface ToastActions {
  openToast: (id: ToastId, toastProperties: ToastProperties) => void;
  closeToast: (id: ToastId) => void;
}

const ToastContext = createContext<ToastContextState>({
  toasts: {},
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  setToasts: (t: Record<ToastId, ToastProperties>) => {
    return;
  },
});

const toastStyles = css({
  button: {
    position: 'absolute',
  },
});

const ToastPile = (): React.ReactElement => {
  const { toasts } = useContext(ToastContext);
  const { closeToast } = useGlobalToast();

  return (
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
  );
};

/**
 * @example
 *
 * ```
 * const MyButton = () => {
 *   const { openToast } = useToast();
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
  children: React.ReactChildren;
  theme: ToastActions;
}): React.ReactElement => {
  const [toasts, setToasts] = useState({});

  return (
    <ToastContext.Provider value={{ toasts, setToasts }}>
      <>{children}</>
      <ToastPile />
    </ToastContext.Provider>
  );
};

function useGlobalToast(): ToastActions {
  const { toasts, setToasts } = useContext(ToastContext);

  const closeToast = useCallback(
    (toastId: ToastId): void => {
      const { timeoutRef } = toasts[toastId] || {};
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      const newToasts = { ...toasts };
      delete newToasts[toastId];
      setToasts(newToasts);
    },
    [toasts, setToasts]
  );

  const openToast = useCallback(
    (toastId: ToastId, toastProperties: ToastProperties): void => {
      // if updating clear timeouts first
      const { timeoutRef } = toasts[toastId] || {};
      if (timeoutRef) {
        clearTimeout(timeoutRef);
      }

      setToasts({
        ...toasts,
        [toastId]: {
          ...toastProperties,
          timeoutRef: toastProperties.timeout
            ? setTimeout(() => {
                closeToast(toastId);
              }, toastProperties.timeout)
            : undefined,
        },
      });
    },
    [toasts, setToasts, closeToast]
  );

  return {
    openToast,
    closeToast,
  };
}

const namespacedId = (namespace: string, id: ToastId) => `${namespace}--${id}`;

export function useToast(namespace: string): ToastActions {
  const { openToast: openGlobalToast, closeToast: closeGlobalToast } =
    useGlobalToast();

  const openToast = useCallback(
    (toastId: ToastId, toastProperties: ToastProperties): void => {
      openGlobalToast(namespacedId(namespace, toastId), toastProperties);
    },
    [namespace, openGlobalToast]
  );

  const closeToast = useCallback(
    (toastId: ToastId): void => {
      closeGlobalToast(namespacedId(namespace, toastId));
    },
    [namespace, closeGlobalToast]
  );

  return {
    openToast,
    closeToast,
  };
}
