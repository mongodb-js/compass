import React, { forwardRef } from 'react';

import { getOverlayDrawerLayoutStyles } from './overlay-drawer-layout.styles';
import type { OverlayDrawerLayoutProps } from './overlay-drawer-layout.types';

/**
 * @internal
 *
 * This layout wrapper is used to create a layout that has 2 grid columns. The main content is on the left and the drawer is on the right.
 *
 * Since this layout is used for overlay drawers, when the drawer is open, the layout will not shift. Instead the shifting is handled by the children of this component.
 *
 */
export const OverlayDrawerLayout = forwardRef<
  HTMLDivElement,
  OverlayDrawerLayoutProps
>(
  (
    { children, className, hasToolbar = false }: OverlayDrawerLayoutProps,
    forwardedRef
  ) => {
    return (
      <div
        ref={forwardedRef}
        className={getOverlayDrawerLayoutStyles({
          className,
          hasToolbar,
        })}
      >
        {children}
      </div>
    );
  }
);

OverlayDrawerLayout.displayName = 'OverlayDrawerLayout';
