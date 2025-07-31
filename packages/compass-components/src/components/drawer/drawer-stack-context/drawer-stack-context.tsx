import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import type { DrawerStackContextType } from './drawer-stack-context.types';

export const DrawerStackContext = createContext<DrawerStackContextType>({
  getDrawerIndex: () => 0,
  registerDrawer: () => {},
  unregisterDrawer: () => {},
});

export const DrawerStackProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [stack, setStack] = useState<Array<string>>([]);

  const getDrawerIndex = useCallback(
    (id: string) => {
      return stack.indexOf(id);
    },
    [stack]
  );

  const registerDrawer = useCallback(
    (id: string) => {
      setStack((prev) => {
        if (prev.includes(id)) return prev;
        return [...prev, id];
      });
    },
    [setStack]
  );

  const unregisterDrawer = useCallback(
    (id: string) => {
      setStack((prev) => {
        if (!prev.includes(id)) return prev;
        return prev.filter((item) => item !== id);
      });
    },
    [setStack]
  );

  const value = useMemo(
    () => ({ getDrawerIndex, registerDrawer, unregisterDrawer }),
    [getDrawerIndex, registerDrawer, unregisterDrawer]
  );

  return (
    <DrawerStackContext.Provider value={value}>
      {children}
    </DrawerStackContext.Provider>
  );
};

export const useDrawerStackContext = () => {
  const context = useContext(DrawerStackContext);

  return context;
};
