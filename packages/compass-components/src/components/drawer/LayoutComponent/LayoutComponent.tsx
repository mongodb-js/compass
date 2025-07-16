import React, { forwardRef } from 'react';

import LeafyGreenProvider, {
  useDarkMode,
} from '@leafygreen-ui/leafygreen-provider';

import { DisplayMode } from '../Drawer';
import { EmbeddedDrawerLayout } from '../EmbeddedDrawerLayout';
import { OverlayDrawerLayout } from '../OverlayDrawerLayout';

import { LayoutComponentProps } from './LayoutComponent.types';

/**
 * @internal
 *
 * LayoutComponent is a wrapper component that provides a layout for displaying content with a drawer.
 * It can be used in both overlay and embedded modes.
 */
export const LayoutComponent = forwardRef<HTMLDivElement, LayoutComponentProps>(
  (
    {
      children,
      displayMode,
      darkMode: darkModeProp,
      isDrawerOpen = false,
      ...rest
    }: LayoutComponentProps,
    forwardRef
  ) => {
    const { darkMode } = useDarkMode(darkModeProp);

    return (
      <LeafyGreenProvider darkMode={darkMode}>
        {displayMode === DisplayMode.Overlay ? (
          <OverlayDrawerLayout ref={forwardRef} {...rest}>
            {children}
          </OverlayDrawerLayout>
        ) : (
          <EmbeddedDrawerLayout
            ref={forwardRef}
            isDrawerOpen={isDrawerOpen}
            {...rest}
          >
            {children}
          </EmbeddedDrawerLayout>
        )}
      </LeafyGreenProvider>
    );
  }
);

LayoutComponent.displayName = 'LayoutComponent';
