import type { HTMLElementProps } from '@leafygreen-ui/lib';

import type { DrawerProps } from '../drawer/drawer.types';

type PickedDrawerProps = Required<Pick<DrawerProps, 'displayMode'>>;

export interface DrawerWithToolbarWrapperProps
  extends HTMLElementProps<'div'>,
    PickedDrawerProps {
  /**
   * Determines if the Drawer instance is open or closed
   */
  isDrawerOpen: boolean;
}
