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
const withTheme = function <ComponentProps>(
  WrappedComponent: React.ComponentType<ComponentProps>
): React.ComponentType<ComponentProps> {
  const ComponentWithTheme = (
    props: ComponentProps,
    ref: React.ForwardedRef<React.ComponentType<ComponentProps>>
  ) => {
    const theme = useTheme();

    const applyTheme = global?.process?.env?.COMPASS_LG_DARKMODE === 'true';

    return (
      <WrappedComponent
        // Set the darkMode before the props so that the props can
        // override the theme if needed.
        darkMode={applyTheme ? theme?.theme === Theme.Dark : undefined}
        ref={ref}
        {...props}
      />
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithTheme.displayName = `withTheme(${displayName})`;

  return React.forwardRef<typeof WrappedComponent, any>(ComponentWithTheme);
};

export { Theme, ThemeProvider, useTheme, withTheme };
