import React, { forwardRef } from 'react';

import { DrawerToolbarProvider } from '../DrawerToolbarContext';

import { DrawerToolbarLayoutProps } from './DrawerToolbarLayout.types';
import { DrawerToolbarLayoutContainer } from './DrawerToolbarLayoutContainer';

/**
 * @internal
 *
 * DrawerToolbarLayout is a component that provides a layout for displaying content in a drawer with a toolbar.
 */
export const DrawerToolbarLayout = forwardRef<
  HTMLDivElement,
  DrawerToolbarLayoutProps
>(
  (
    { children, toolbarData, ...rest }: DrawerToolbarLayoutProps,
    forwardRef
  ) => {
    return (
      <DrawerToolbarProvider data={toolbarData}>
        <DrawerToolbarLayoutContainer
          ref={forwardRef}
          toolbarData={toolbarData}
          {...rest}
        >
          {children}
        </DrawerToolbarLayoutContainer>
      </DrawerToolbarProvider>
    );
  }
);

DrawerToolbarLayout.displayName = 'DrawerToolbarLayout';
