import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ToastVariant, Toast } from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';

export { ToastVariant };

export type ToastProperties = {
  title?: React.ReactNode;
  body: React.ReactNode;
  variant: ToastVariant;
  progress?: number;
  timeout?: number;
  dismissible?: boolean;
};

const defaultToastProperties: Partial<ToastProperties> = {
  dismissible: true,
};

interface ToastActions {
  openToast: (id: string, toastProperties: ToastProperties) => void;
  closeToast: (id: string) => void;
}

class GlobalToastState implements ToastActions {
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private toasts = new Map<string, ToastProperties>();
  onToastsChange: (toasts: [string, ToastProperties][]) => void = () => {
    /**/
  };
  openToast(id: string, toastProperties: ToastProperties): void {
    this.clearTimeout(id);
    this.toasts.set(id, {
      ...defaultToastProperties,
      ...toastProperties,
    });
    if (toastProperties.timeout) {
      this.timeouts.set(
        id,
        setTimeout(() => {
          this.closeToast(id);
        }, toastProperties.timeout)
      );
    }
    this.onToastsChange(Array.from(this.toasts.entries()));
  }
  closeToast(id: string): void {
    this.clearTimeout(id);
    this.toasts.delete(id);
    this.onToastsChange(Array.from(this.toasts.entries()));
  }
  clearTimeout(id?: string) {
    if (id) {
      if (this.timeouts.has(id)) {
        clearTimeout(this.timeouts.get(id)!);
        this.timeouts.delete(id);
      }
    } else {
      this.timeouts.forEach((id) => {
        clearTimeout(id);
      });
      this.timeouts.clear();
    }
  }
  clear() {
    this.clearTimeout();
    this.toasts.clear();
  }
}

const toastState = new GlobalToastState();

export const openToast = toastState.openToast.bind(toastState);

export const closeToast = toastState.closeToast.bind(toastState);

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
  const [toasts, setToasts] = useState<[string, ToastProperties][]>([]);
  const toastStateRef = useRef<GlobalToastState>();

  if (!toastStateRef.current) {
    toastStateRef.current = toastState;
    toastStateRef.current.onToastsChange = setToasts;
  }

  const toastActions = useMemo(() => {
    return { openToast, closeToast };
  }, []);

  useEffect(() => {
    return () => {
      toastStateRef.current?.clear();
    };
  }, []);

  return (
    <ToastContext.Provider value={toastActions}>
      <>{children}</>
      <>
        {toasts.map(([id, { dismissible, title, body, variant, progress }]) => (
          <Toast
            className={toastStyles}
            key={id}
            data-testid={`toast-${id}`}
            title={title}
            body={body}
            variant={variant}
            progress={progress}
            open={true}
            close={dismissible ? () => closeToast(id) : undefined}
          />
        ))}
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
