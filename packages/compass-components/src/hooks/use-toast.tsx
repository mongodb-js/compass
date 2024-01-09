import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
} from 'react';
import type { ToastProps } from '../components/leafygreen';
import {
  ToastProvider,
  useToast as useLeafygreenToast,
} from '../components/leafygreen';
import { css } from '@leafygreen-ui/emotion';

export type ToastProperties = Pick<
  ToastProps,
  'title' | 'description' | 'variant' | 'progress' | 'timeout' | 'dismissible'
>;

const defaultToastProperties: Partial<ToastProperties> = {
  dismissible: true,
};

export interface ToastActions {
  openToast: (id: string, toastProperties: ToastProperties) => void;
  closeToast: (id: string) => void;
}

interface OnToastChange {
  (
    action: 'push',
    toast: ToastProperties & { id: string },
    toasts: Map<string, ToastProperties>
  ): void;
  (
    action: 'pop',
    toast: { id: string },
    toasts: Map<string, ToastProperties>
  ): void;
}

class GlobalToastState implements ToastActions {
  private timeouts = new Map<string, ReturnType<typeof setTimeout>>();
  private toasts = new Map<string, ToastProperties>();
  onToastsChange: OnToastChange = () => {
    /** noop */
  };
  openToast(id: string, props: ToastProperties): void {
    this.clearTimeout(id);
    const toastProps = {
      ...defaultToastProperties,
      ...props,
      'data-testid': `toast-${id}`,
      onClose: () => {
        this.closeToast(id);
      },
    };
    this.toasts.set(id, toastProps);
    if (toastProps.timeout) {
      const timeoutId = setTimeout(() => {
        this.closeToast(id);
      }, toastProps.timeout);
      this.timeouts.set(id, timeoutId);
      // If we are in the node environment, unref the timeout to allow process
      // to exit (this is mostly needed for test environments)
      timeoutId.unref?.();
    }
    this.onToastsChange('push', { id, ...toastProps }, this.toasts);
  }
  closeToast(id: string): void {
    this.clearTimeout(id);
    this.toasts.delete(id);
    this.onToastsChange('pop', { id }, this.toasts);
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
  clear(): string[] {
    this.clearTimeout();
    const ids = Array.from(this.toasts.keys());
    this.toasts.clear();
    return ids;
  }
}

const toastState = new GlobalToastState();

export const openToast = toastState.openToast.bind(toastState);

export const closeToast = toastState.closeToast.bind(toastState);

const toastActions = { openToast, closeToast };

const ToastContext = createContext<ToastActions>({
  openToast: () => {
    //
  },
  closeToast: () => {
    //
  },
});

const _ToastArea: React.FunctionComponent = ({ children }) => {
  // NB: the way leafygreen implements this hook leads to anything specifying
  // toast methods in hooks dependencies to constantly update potentially
  // causing infinite loops of toasts. To work around that we are storing toast
  // interface in a ref so that we can safely use it inside our effects
  //
  // @see {@link https://jira.mongodb.org/browse/LG-3209}
  const toastRef = useRef(useLeafygreenToast());
  const toastStateRef = useRef<GlobalToastState>();

  if (!toastStateRef.current) {
    toastStateRef.current = toastState;
    toastStateRef.current.onToastsChange = (action, toast) => {
      if (action === 'push') {
        toastRef.current.pushToast({
          ...(toast as ToastProperties),
          // To be able to maintain a global state of toasts, we remove
          // timeout prop as timeouts handled by the GlobalToast state and our
          // timeouts logic doesn't match leafygreen out
          timeout: null,
        });
      }
      if (action === 'pop') {
        toastRef.current.popToast(toast.id);
      }
    };
  }

  useEffect(() => {
    return () => {
      const ids = toastStateRef.current?.clear();
      ids?.forEach((id) => {
        toastRef.current.popToast(id);
      });
    };
  }, []);

  return (
    <ToastContext.Provider value={toastActions}>
      {children}
    </ToastContext.Provider>
  );
};

const toastAreaFronLayerStyles = css({ zIndex: 1 });
const ToastAreaMountedContext = React.createContext(false);

export const ToastArea: React.FunctionComponent = ({ children }) => {
  if (useContext(ToastAreaMountedContext)) {
    return <>{children}</>;
  }

  return (
    <ToastAreaMountedContext.Provider value={true}>
      <ToastProvider portalClassName={toastAreaFronLayerStyles}>
        <_ToastArea>{children}</_ToastArea>
      </ToastProvider>
    </ToastAreaMountedContext.Provider>
  );
};

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
