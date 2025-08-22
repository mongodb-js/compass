import React, { createContext, useContext, useState } from 'react';
import useResizeObserver from 'use-resize-observer';

import {
  LeafyGreenChatContextProps,
  LeafyGreenChatProviderProps,
  Variant,
} from './LeafyGreenChatProvider.types';

const DEFAULT_ASSISTANT_NAME = 'MongoDB Assistant';

const LeafyGreenChatContext = createContext<LeafyGreenChatContextProps>({
  assistantName: DEFAULT_ASSISTANT_NAME,
  containerWidth: undefined,
  variant: Variant.Compact,
});
export const useLeafyGreenChatContext = () => useContext(LeafyGreenChatContext);

export function LeafyGreenChatProvider({
  assistantName = DEFAULT_ASSISTANT_NAME,
  children,
  variant = Variant.Compact,
}: LeafyGreenChatProviderProps) {
  const [containerWidth, setContainerWidth] = useState<number>();

  const { ref: resizeRef } = useResizeObserver<HTMLDivElement>({
    onResize: ({ width }) => {
      setContainerWidth(width);
    },
  });

  return (
    <LeafyGreenChatContext.Provider
      value={{
        assistantName,
        containerWidth,
        variant,
      }}
    >
      <div style={{ width: '100%' }} ref={resizeRef}>
        {children}
      </div>
    </LeafyGreenChatContext.Provider>
  );
}

LeafyGreenChatProvider.displayName = 'LeafyGreenChatProvider';
