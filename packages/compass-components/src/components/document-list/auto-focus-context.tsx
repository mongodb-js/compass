import { createContext, useContext } from 'react';

type AutoFocusInfo = {
  id: string;
  type: 'key' | 'value' | 'type';
} | null;

export const AutoFocusContext = createContext<AutoFocusInfo>(null);

export function useAutoFocusContext(): AutoFocusInfo {
  return useContext(AutoFocusContext);
}
