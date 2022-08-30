import { createContext } from 'react';
import type { ComboboxSize, TrunctationLocation } from './combobox-types';

interface ComboboxData {
  multiselect: boolean;
  darkMode: boolean;
  size: keyof typeof ComboboxSize;
  withIcons: boolean;
  disabled: boolean;
  chipTruncationLocation?: TrunctationLocation;
  chipCharacterLimit?: number;
  inputValue?: string;
}

export const ComboboxContext = createContext<ComboboxData>({
  multiselect: false,
  darkMode: false,
  size: 'default',
  withIcons: false,
  disabled: false,
});
