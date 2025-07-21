import React, {
  createContext,
  type PropsWithChildren,
  useContext,
  useMemo,
} from 'react';

import LeafyGreenProvider from '@leafygreen-ui/leafygreen-provider';

import { getLgIds } from '../utils';

import type { ToolbarProviderProps } from './toolbar-context.types';

export const ToolbarContext = createContext<ToolbarProviderProps>({
  focusedIndex: undefined,
  shouldFocus: false,
  lgIds: getLgIds(),
  handleOnIconButtonClick: () => {},
});

export const useToolbarContext = () =>
  useContext<ToolbarProviderProps>(ToolbarContext);

export const ToolbarContextProvider = ({
  children,
  focusedIndex,
  shouldFocus,
  lgIds,
  handleOnIconButtonClick,
  darkMode = false,
}: PropsWithChildren<ToolbarProviderProps>) => {
  const ToolbarProvider = ToolbarContext.Provider;

  const toolbarProviderData = useMemo(() => {
    return {
      focusedIndex,
      shouldFocus,
      lgIds,
      handleOnIconButtonClick,
    };
  }, [focusedIndex, shouldFocus, lgIds, handleOnIconButtonClick]);

  return (
    <LeafyGreenProvider darkMode={darkMode}>
      <ToolbarProvider value={toolbarProviderData}>{children}</ToolbarProvider>
    </LeafyGreenProvider>
  );
};
