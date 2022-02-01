import React, { createContext, useContext } from 'react';

export enum SavedTheme {
  OS_THEME = 'OS_THEME',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
}
export type Theme = 'LIGHT' | 'DARK';

type ThemeState = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeState>({
  theme: 'LIGHT',
});

const ThemeProvider = ({
  children,
  theme,
}: {
  children: React.ReactChildren;
  theme: ThemeState;
}): React.ReactElement => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

function useTheme(): ThemeState {
  return useContext(ThemeContext);
}

export { useTheme, ThemeProvider };
