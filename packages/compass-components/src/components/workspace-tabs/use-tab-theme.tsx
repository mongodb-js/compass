import React, { useContext } from 'react';

export type TabTheme = {
  '--workspace-tab-background-color': string;
  '--workspace-tab-selected-background-color': string;
  '--workspace-tab-top-border-color': string;
  '--workspace-tab-selected-top-border-color': string;
  '--workspace-tab-border-color': string;
  '--workspace-tab-color': string;
  '--workspace-tab-selected-color': string;
  '&:focus-visible': {
    '--workspace-tab-selected-color': string;
    '--workspace-tab-border-color': string;
  };
};

type TabThemeProviderValue = Partial<TabTheme> | undefined;

type TabThemeContextValue = TabThemeProviderValue | null;

const TabThemeContext = React.createContext<TabThemeContextValue>(null);

export const TabThemeProvider: React.FunctionComponent<{
  children: React.ReactNode;
  theme: Partial<TabTheme>;
}> = ({ children, theme }) => {
  return (
    <TabThemeContext.Provider value={theme}>
      {children}
    </TabThemeContext.Provider>
  );
};

export function useTabTheme(): Partial<TabTheme> | undefined {
  const context = useContext(TabThemeContext);
  if (!context) {
    throw new Error('useTabTheme must be used within a TabThemeProvider');
  }

  return context;
}
