import React, { createContext, useContext } from 'react';

enum Theme {
  Light = 'Light',
  Dark = 'Dark',
}

type ThemeState = {
  theme: Theme;
};

const ThemeContext = createContext<ThemeState>({
  theme: Theme.Light,
});

const ThemeProvider = ({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: ThemeState;
}): React.ReactElement => {
  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

function useTheme(): ThemeState {
  return useContext(ThemeContext);
}

// High Order Component(HOC) used to inject Compass' theme pulled from the
// available ThemeProvider on the React context into the wrapped component.
function withTheme<T>(
  WrappedComponent: React.ComponentType<T>
): (props: T) => JSX.Element {
  const ComponentWithTheme = (props: T) => {
    const theme = useTheme();

    return <WrappedComponent
      // Set the darkMode before the props so that the props can
      // override the theme if needed.
      darkMode={theme?.theme === Theme.Dark}
      {...(props )}
    />;
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithTheme.displayName = `withTheme(${displayName})`;

  return ComponentWithTheme;
}

export { Theme, ThemeProvider, useTheme, withTheme };
