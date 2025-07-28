import type { BaseLayoutComponentProps } from '../layout-component/layout-component.styles';

export type EmbeddedDrawerLayoutProps = BaseLayoutComponentProps & {
  /**
   * Determines if the Drawer is open. This will shift the layout to the right by the width of the drawer + toolbar if it exists if the display mode is set to 'embedded'.
   */
  isDrawerOpen?: boolean;
};
