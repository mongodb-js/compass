import React, { useContext, useEffect, useMemo, useRef } from 'react';
import type { ToastProps } from '@leafygreen-ui/toast';
import {
  ToastProvider,
  useToast as useLeafygreenToast,
} from '@leafygreen-ui/toast';
import { useStackedComponent } from './use-stacked-component';
import { css } from '..';

export type ToastProperties = Pick<
  ToastProps,
  | 'actionElement'
  | 'title'
  | 'description'
  | 'variant'
  | 'progress'
  | 'timeout'
  | 'dismissible'
  | 'onClose'
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
      onClose: (e: React.EventHandler<any>) => {
        this.closeToast(id);
        props.onClose?.(e);
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
        clearTimeout(this.timeouts.get(id));
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

/**
 * Programmatically trigger a
 * [leafygreen Toast](https://www.mongodb.design/component/toast/code-docs)
 * component to appear on the screen. Can be used both inside and __outside__
 * React rendering tree. The latter is especially useful for triggering toast
 * showing up for any async business logic flow.
 *
 * @example
 * function insertDocumentAction() {
 *   dataService.insertOne(...).then(
 *     () => {
 *       openToast(
 *         `insert-doc-${ns}`,
 *         { variant: 'success', title: 'Successfully inserted document' }
 *       )
 *     },
 *     (err) => {
 *       openToast(
 *         `insert-doc-${ns}`,
 *         { variant: 'warning', title: 'Failed to insert document', description: err.message }
 *       )
 *     }
 *   )
 * }
 *
 * Same method can be used to update the content of the toast that is already
 * displayed
 *
 * @example
 * function insertManyDocuments() {
 *   let total = 0;
 *   for (const doc of docs) {
 *     await dataService.insertOne(doc);
 *     openToast(
 *       `insert-doc-${ns}`,
 *       { variant: 'progress', title: 'Inserting documents', progress: docs.length / ++total }
 *     )
 *   }
 * }
 *
 * @param id unique toast id that can be used to close the toast later
 * @param props Toast rendering properties
 */
export const openToast = toastState.openToast.bind(toastState);

/**
 * Programmatically close a toast with a matching id
 *
 * @param id unique toast id
 */
export const closeToast = toastState.closeToast.bind(toastState);

const ToastStateHandler: React.FunctionComponent = ({ children }) => {
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

  return <>{children}</>;
};

const ToastAreaMountedContext = React.createContext(false);

export const ToastArea: React.FunctionComponent = ({ children }) => {
  const stackedContext = useStackedComponent();
  // We always want to show the toast over modal or other stacked components that may hide the toast and hence +1
  const stackedElemStyles = useMemo(() => {
    const zIndex = stackedContext?.zIndex ? stackedContext.zIndex + 1 : 1;
    return css({ zIndex });
  }, [stackedContext]);

  if (useContext(ToastAreaMountedContext)) {
    return <>{children}</>;
  }

  return (
    <ToastAreaMountedContext.Provider value={true}>
      <ToastProvider portalClassName={stackedElemStyles}>
        <ToastStateHandler>{children}</ToastStateHandler>
      </ToastProvider>
    </ToastAreaMountedContext.Provider>
  );
};
