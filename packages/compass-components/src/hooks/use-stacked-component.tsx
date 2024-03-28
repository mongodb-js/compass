import type { ComponentType, ForwardedRef } from 'react';
import React, { createContext, useContext, useMemo } from 'react';

type StackedComponentProviderProps = {
  zIndex?: number;
};

const StackedComponentContext =
  createContext<StackedComponentProviderProps | null>(null);

export const StackedComponentProvider = ({
  zIndex,
  children,
}: StackedComponentProviderProps & { children: React.ReactNode }) => {
  const value = useMemo(() => ({ zIndex }), [zIndex]);
  return (
    <StackedComponentContext.Provider value={value}>
      {children}
    </StackedComponentContext.Provider>
  );
};

export const useStackedComponent = () => {
  return useContext(StackedComponentContext);
};

type StackedComponentProps<T extends boolean> = T extends true
  ? { popoverZIndex?: number }
  : T extends false
  ? { style?: React.CSSProperties }
  : Record<string, never>;

// TODO(LG-4109): This should be eventually supported by the LG design system
const withBaseStyles = function <UsePopover extends boolean, ComponentProps>(
  WrappedComponent: ComponentType<ComponentProps>,
  usePopoverZIndex: UsePopover
): ComponentType<ComponentProps> {
  const ComponentWithStackedStyles = (
    props: ComponentProps,
    ref: ForwardedRef<ComponentType<ComponentProps>>
  ) => {
    const context = useStackedComponent();
    const stackedElementProps = useMemo(() => {
      if (context?.zIndex) {
        if (usePopoverZIndex) {
          return {
            popoverZIndex:
              (props as StackedComponentProps<true>).popoverZIndex ??
              context.zIndex,
          };
        } else {
          return {
            style: {
              zIndex: context.zIndex,
              ...(props as StackedComponentProps<false>).style,
            },
          };
        }
      }
      return {};
    }, [
      context,
      (props as StackedComponentProps<true>).popoverZIndex,
      (props as StackedComponentProps<false>).style,
    ]);

    return <WrappedComponent ref={ref} {...props} {...stackedElementProps} />;
  };

  const displayName =
    WrappedComponent.displayName || WrappedComponent.name || 'Component';
  ComponentWithStackedStyles.displayName = `WithStackedStyles(${displayName})`;

  return React.forwardRef(
    ComponentWithStackedStyles
  ) as typeof WrappedComponent;
};

export const withStackedComponentStyles = function <
  ComponentProps extends { className?: string }
>(
  WrappedComponent: ComponentType<ComponentProps>
): ComponentType<ComponentProps> {
  return withBaseStyles(WrappedComponent, false);
};

export const withStackedComponentPopoverStyles = function <
  ComponentProps extends { popoverZIndex?: number }
>(
  WrappedComponent: ComponentType<ComponentProps>
): ComponentType<ComponentProps> {
  return withBaseStyles(WrappedComponent, true);
};
