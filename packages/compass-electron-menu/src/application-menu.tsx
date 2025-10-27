import React, { useContext, useEffect } from 'react';
import type { CompassAppMenu, MenuItemConstructorOptions } from './types';
import { transformAppMenu } from './types';
import { getObjectId } from './util';

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
    const subscriptions = [
      menu && showApplicationMenu(menu),
      ...Object.entries(roles ?? {}).map(([role, handler]) =>
        handleMenuRole(role as MenuItemConstructorOptions['role'], handler)
      ),
    ];

    return () => {
      for (const unsubscribe of subscriptions) unsubscribe?.();
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
