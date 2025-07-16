import { DarkModeProps, HTMLElementProps } from '@leafygreen-ui/lib';

import { DisplayMode } from '../Drawer';
import { EmbeddedDrawerLayoutProps } from '../EmbeddedDrawerLayout';
import { OverlayDrawerLayoutProps } from '../OverlayDrawerLayout';

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
