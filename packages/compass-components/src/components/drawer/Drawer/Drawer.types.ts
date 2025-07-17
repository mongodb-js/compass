import type React from 'react';

import type {
  DarkModeProps,
  HTMLElementProps,
  LgIdProps,
} from '@leafygreen-ui/lib';

/**
 * Options to control how the drawer element is displayed
 * @param Embedded will display a drawer as a `<div>` element that takes up the full parent container height and on the same elevation as container page content. It is recommended to wrap an embedded drawer within the `DrawerLayout` container
 * @param Overlay will display a drawer as a `<dialog>` element that takes up the full parent container height and elevated above container page content. It is recommended to wrap an overlay drawer within the `DrawerLayout` container
 */
export const DisplayMode = {
  Embedded: 'embedded',
  Overlay: 'overlay',
} as const;
export type DisplayMode = typeof DisplayMode[keyof typeof DisplayMode];

export interface DrawerProps
  extends Omit<HTMLElementProps<'dialog' | 'div'>, 'title'>,
    DarkModeProps,
    LgIdProps {
  /**
   * Options to display the drawer element
   * @defaultValue 'overlay'
   * @param Embedded will display a drawer as a `<div>` element that takes up the full parent container height and on the same elevation as container page content. It is recommended to wrap an embedded drawer within the `DrawerLayout` container
   * @param Overlay will display a drawer as a `<dialog>` element that takes up the full parent container height and elevated above container page content. It is recommended to wrap an overlay drawer within the `DrawerLayout` container
   */
  displayMode?: DisplayMode;

  /**
   * Determines if the Drawer is open or closed
   * @defaultValue false
   */
  open?: boolean;

  /**
   * Event handler called on close button click. If provided, a close button will be rendered in the Drawer header.
   */
  onClose?: React.MouseEventHandler<HTMLButtonElement>;

  /**
   * Title of the Drawer
   */
  title: React.ReactNode;
}
