import type { ComponentType, ForwardedRef } from 'react';
import React, { createContext, useContext, useMemo } from 'react';
import { cx, css } from '@leafygreen-ui/emotion';

type StackedComponentProviderProps = {
  zIndex?: number;
};

const StackedComponentContext =
  createContext<StackedComponentProviderProps | null>(null);

export const StackedComponentProvider = ({
  zIndex,
  children,
}: StackedComponentProviderProps & { children: React.ReactNode }) => {
  return (
    <StackedComponentContext.Provider value={{ zIndex }}>
      {children}
    </StackedComponentContext.Provider>
  );
};

export const useStackedComponent = () => {
  return useContext(StackedComponentContext);
};

// TODO: LG-4109. This should be eventually supported by the LG design system
export const withStackedComponentStyles = function <
  ComponentProps extends { className?: string }
>(
  WrappedComponent: ComponentType<ComponentProps>
): ComponentType<ComponentProps> {
  const ComponentWithStackedStyles = (
    props: ComponentProps,
    ref: ForwardedRef<ComponentType<ComponentProps>>
  ) => {
    const context = useStackedComponent();
    const stackedElementStyles = useMemo(() => {
      if (context?.zIndex) {
        return css({
          zIndex: context.zIndex,
        });
      }
      return '';
    }, [context]);
    return (
      <WrappedComponent
        ref={ref}
        {...props}
        className={cx(props.className, stackedElementStyles)}
      />
    );
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithStackedStyles.displayName = `WithStackedStyles(${displayName})`;

  return React.forwardRef(
    ComponentWithStackedStyles
  ) as typeof WrappedComponent;
};
