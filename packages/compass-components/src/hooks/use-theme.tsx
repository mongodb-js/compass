import React, { createContext, useContext } from 'react';

enum Theme {
  Light = 'Light',
  Dark = 'Dark',
}

type ThemeState = {
  theme: Theme;
  enabled: boolean;
};

const ThemeContext = createContext<ThemeState>({
  theme: Theme.Light,
  enabled: false,
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

export function useDarkMode(forceDarkMode?: boolean): boolean | undefined {
  const theme = useTheme();
  return (
    forceDarkMode ??
    (theme.enabled === true ? theme?.theme === Theme.Dark : undefined)
  );
}

interface WithThemeProps {
  darkMode?: boolean;
}

// High Order Component(HOC) used to inject Compass' theme pulled from the
// available ThemeProvider on the React context into the wrapped component.
const withTheme = function <
  ComponentProps extends WithThemeProps = WithThemeProps
>(
  WrappedComponent: React.ComponentType<ComponentProps & WithThemeProps>
): React.ComponentType<ComponentProps> {
  const ComponentWithTheme = (
    props: ComponentProps,
    ref: React.ForwardedRef<
      React.ComponentType<ComponentProps & WithThemeProps>
    >
  ) => {
    const darkMode = useDarkMode();
    return (
      <WrappedComponent
        // Set the darkMode before the props so that the props can
        // override the theme if needed.
        darkMode={darkMode}
        ref={ref}
        {...props}
      />
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithTheme.displayName = `withTheme(${displayName})`;

  return React.forwardRef(ComponentWithTheme) as typeof WrappedComponent;
};

export { Theme, ThemeState, ThemeProvider, useTheme, withTheme };
