import { createContext } from 'react';

import { Theme } from '@leafygreen-ui/lib';

import {
  ComboboxSize,
  SearchState,
  State,
  TruncationLocation,
} from './Combobox.types';

interface ComboboxData {
  multiselect: boolean;
  darkMode: boolean;
  theme: Theme;
  size: ComboboxSize;
  withIcons: boolean;
  disabled: boolean;
  isOpen: boolean;
  state: State;
  searchState: SearchState;
  chipTruncationLocation?: TruncationLocation;
  chipCharacterLimit?: number;
  inputValue?: string;
  searchInputSize: number;
}

export const ComboboxContext = createContext<ComboboxData>({
  multiselect: false,
  darkMode: false,
  theme: Theme.Light,
  size: ComboboxSize.Default,
  withIcons: false,
  disabled: false,
  isOpen: false,
  state: State.none,
  searchState: SearchState.unset,
  searchInputSize: 384,
});
