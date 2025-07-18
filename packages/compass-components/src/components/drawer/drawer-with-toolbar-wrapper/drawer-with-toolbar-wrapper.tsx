import React, { forwardRef, useEffect, useState } from 'react';

import { useDarkMode } from '@leafygreen-ui/leafygreen-provider';

import { getDrawerWithToolbarWrapperStyles } from './drawer-with-toolbar-wrapper.styles';
import type { DrawerWithToolbarWrapperProps } from './drawer-with-toolbar-wrapper.types';

/**
 * @internal
 *
 * This layout wrapper is used to position the toolbar and drawer together. When the drawer is open, the toolbar and drawer will shift to the right.
 *
 * If the drawer is overlay, a box shadow will be applied to the left side of this component.
 */
export const DrawerWithToolbarWrapper = forwardRef<
  HTMLDivElement,
  DrawerWithToolbarWrapperProps
>(
  (
    {
      children,
      className,
      isDrawerOpen,
      displayMode,
    }: DrawerWithToolbarWrapperProps,
    forwardedRef
  ) => {
    const { theme } = useDarkMode();
    const [shouldAnimate, setShouldAnimate] = useState(false);

    useEffect(() => {
      if (isDrawerOpen) setShouldAnimate(true);
    }, [isDrawerOpen]);

    return (
      <div
        ref={forwardedRef}
        className={getDrawerWithToolbarWrapperStyles({
          className,
          isDrawerOpen,
          shouldAnimate,
          displayMode,
          theme,
        })}
      >
        {children}
      </div>
    );
  }
);

DrawerWithToolbarWrapper.displayName = 'DrawerWithToolbarWrapper';
