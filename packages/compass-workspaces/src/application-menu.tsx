import React, { useContext, useEffect } from 'react';
import { createServiceLocator } from '@mongodb-js/compass-app-registry';

// Type-only import in a separate entry point, so this is fine
// compass-peer-deps-ignore
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import type { MenuItemConstructorOptions } from 'electron';

export type CompassAppMenu<ClickHandlerType = () => void> = Omit<
  MenuItemConstructorOptions,
  'click' | 'submenu'
> & { click?: ClickHandlerType; submenu?: CompassAppMenu<ClickHandlerType>[] };

export interface ApplicationMenuProvider {
  // These functions return 'unsubscribe'-style listeners to remove
  // the handlers again
  showApplicationMenu(this: void, menu: CompassAppMenu): () => void;
  handleMenuRole(
    this: void,
    role: MenuItemConstructorOptions['role'],
    handler: () => void
  ): () => void;
}

const ApplicationMenuContext = React.createContext<ApplicationMenuProvider>({
  showApplicationMenu: () => () => {},
  handleMenuRole: () => () => {},
});

export function ApplicationMenuContextProvider({
  provider,
  children,
}: {
  provider: ApplicationMenuProvider;
  children: React.ReactNode;
}) {
  return (
    <ApplicationMenuContext.Provider value={provider}>
      {children}
    </ApplicationMenuContext.Provider>
  );
}

function useApplicationMenuService(): ApplicationMenuProvider {
  return useContext(ApplicationMenuContext);
}

export const applicationMenuServiceLocator = createServiceLocator(
  useApplicationMenuService,
  'applicationMenuServiceLocator'
);

// Shared helper that is useful in a few places since we need to
// translate between 'real function' click handlers and
// string identifiers for those click handlers in a few places.
export function transformAppMenu<T, U>(
  menu: CompassAppMenu<T>,
  transform: (
    cb: Omit<CompassAppMenu<T>, 'submenu'>
  ) => Omit<CompassAppMenu<U>, 'submenu'>
): CompassAppMenu<U> {
  return {
    ...transform({ ...menu }),
    submenu: menu.submenu
      ? menu.submenu.map((sub) => transformAppMenu(sub, transform))
      : undefined,
  };
}

const objectIds = new WeakMap<object, number>();
let objectIdCounter = 0;

function getObjectId(obj: object): number {
  let id = objectIds.get(obj);
  if (id === undefined) {
    id = ++objectIdCounter;
    objectIds.set(obj, id);
  }
  return id;
}

// Hook to set up an additional application menu, as well as
// override handlers for pre-defined Electron menu roles.
//
// Example usage:
//
// useApplicationMenu({
//   menu: {
//     label: '&MyMenu',
//     submenu: [
//       {
//         label: 'Do Something',
//         click: () => { ... }
//       }
//     ]
//   },
//   roles: {
//     undo: () => { ... },
//     redo: () => { ... }
//   }
// });
//
// You will typically want to memoize the callbacks used in these objects
// since they end up as part of the dependency array for this hook.
export function useApplicationMenu({
  menu,
  roles,
}: {
  menu?: CompassAppMenu;
  roles?: Partial<
    Record<NonNullable<MenuItemConstructorOptions['role']>, () => void>
  >;
}): void {
  const { showApplicationMenu, handleMenuRole } = useApplicationMenuService();

  useEffect(() => {
    const hideMenu = menu && showApplicationMenu(menu);
    const subscriptions = Object.entries(roles ?? {}).map(([role, handler]) =>
      handleMenuRole(role as MenuItemConstructorOptions['role'], handler)
    );

    return () => {
      hideMenu?.();
      for (const unsubscribe of subscriptions) unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    showApplicationMenu,
    handleMenuRole,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    menu
      ? JSON.stringify(
          transformAppMenu(menu, (item) => ({
            ...item,
            click: item.click && getObjectId(item.click),
          }))
        )
      : undefined,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    roles ? JSON.stringify(Object.values(roles).map(getObjectId)) : undefined,
  ]);
}
