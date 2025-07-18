import React, { forwardRef } from 'react';

import { DrawerToolbarProvider } from '../drawer-toolbar-context';

import type { DrawerToolbarLayoutProps } from './drawer-toolbar-layout.types';
import { DrawerToolbarLayoutContainer } from './drawer-toolbar-layout-container';

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
