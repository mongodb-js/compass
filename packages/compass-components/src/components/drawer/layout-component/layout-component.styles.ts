import type { DarkModeProps, HTMLElementProps } from '@leafygreen-ui/lib';

import type { DisplayMode } from '../drawer';
import type { EmbeddedDrawerLayoutProps } from '../embedded-drawer-layout';
import type { OverlayDrawerLayoutProps } from '../overlay-drawer-layout';

export type LayoutComponentProps = {
  displayMode: DisplayMode;
} & DarkModeProps &
  (
    | EmbeddedDrawerLayoutProps
    | (OverlayDrawerLayoutProps & { isDrawerOpen?: never })
  );

// This interface is used to define the common properties for OverlayDrawerLayout and EmbeddedDrawerLayout
export interface BaseLayoutComponentProps
  extends Omit<HTMLElementProps<'div'>, 'children'> {
  /**
   * Determines if the Toolbar is present in the layout
   */
  hasToolbar?: boolean;

  /**
   * The content to be rendered inside the Drawer
   */
  children: React.ReactNode;
}
