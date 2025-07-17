import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from 'react';

import { drawerTransitionDuration } from '../drawer/drawer.styles';

import type {
  ContextData,
  DataId,
  DrawerToolbarContextType,
  DrawerToolbarProviderProps,
} from './drawer-toolbar-context.types';

export const DrawerToolbarContext =
  createContext<DrawerToolbarContextType | null>(null);

export const DrawerToolbarProvider = ({
  children,
  data,
}: DrawerToolbarProviderProps) => {
  const [content, setContent] = useState<ContextData>(undefined);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  const openDrawer = useCallback(
    (id: DataId) => {
      const activeDrawerContent = data.find(
        (item) => item?.id === id && item?.content
      );

      if (activeDrawerContent) {
        setIsDrawerOpen(true);
        setContent((prev) => {
          if (prev?.id === id) return prev;
          return activeDrawerContent;
        });
      } else {
        // eslint-disable-next-line no-console
        console.error(
          `No matching item found in the toolbar for the provided id: ${id}. Please verify that the id is correct.`
        );
      }
    },
    [setContent, data, setIsDrawerOpen]
  );

  const closeDrawer = useCallback(() => {
    // Delay the removal of the content to allow the drawer to close before removing the content
    setTimeout(() => {
      setContent(undefined);
    }, drawerTransitionDuration);
    setIsDrawerOpen(false);
  }, [setContent]);

  const getActiveDrawerContent = useCallback(() => {
    return content;
  }, [content]);

  const value = useMemo(
    () => ({
      openDrawer,
      closeDrawer,
      getActiveDrawerContent,
      isDrawerOpen,
    }),
    [openDrawer, closeDrawer, getActiveDrawerContent, isDrawerOpen]
  );

  return (
    <DrawerToolbarContext.Provider value={value}>
      {children}
    </DrawerToolbarContext.Provider>
  );
};

export const useDrawerToolbarContext = () => {
  const context = useContext(DrawerToolbarContext);

  if (!context) {
    throw new Error(
      'useDrawerToolbarContext must be used within a DrawerToolbarProvider'
    );
  }

  return context;
};
