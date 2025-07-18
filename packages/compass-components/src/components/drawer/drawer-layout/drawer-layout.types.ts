import type { DarkModeProps, HTMLElementProps } from '@leafygreen-ui/lib';

import type { DrawerProps } from '../drawer/drawer.types';
import type { DrawerToolbarLayoutProps } from '../drawer-toolbar-layout';
import type { LayoutComponentProps } from '../layout-component';

export type PickedDrawerProps = Pick<DrawerProps, 'displayMode'>;

export interface BaseDrawerLayoutProps
  extends PickedDrawerProps,
    HTMLElementProps<'div'>,
    DarkModeProps {
  children: React.ReactNode;
}

export type DrawerLayoutPropsWithoutToolbar = Omit<
  LayoutComponentProps,
  'displayMode' | 'isDrawerOpen'
> & {
  /**
   * An array of data that will be used to render the toolbar items and the drawer content.
   */
  toolbarData?: never;

  /**
   * Event handler called on close button click. If provided, a close button will be rendered in the Drawer header.
   */
  onClose?: never;

  /**
   * Determines if the Drawer is open. This is only needed if using the Drawer without a toolbar. This will shift the layout to the right by the width of the drawer if `displayMode` is set to 'embedded'.
   */
  isDrawerOpen?: boolean;
} & BaseDrawerLayoutProps;

export type DrawerLayoutPropsWithToolbar = Omit<
  DrawerToolbarLayoutProps,
  'displayMode'
> & {
  /**
   * Determines if the Drawer is open. This is only needed if using the Drawer without a toolbar. This will shift the layout to the right by the width of the drawer if `displayMode` is set to 'embedded'.
   */
  isDrawerOpen?: never;
} & BaseDrawerLayoutProps;

export type DrawerLayoutProps =
  | ({
      toolbarData: DrawerLayoutPropsWithToolbar['toolbarData'];
    } & DrawerLayoutPropsWithToolbar)
  | ({ toolbarData?: never } & DrawerLayoutPropsWithoutToolbar);
