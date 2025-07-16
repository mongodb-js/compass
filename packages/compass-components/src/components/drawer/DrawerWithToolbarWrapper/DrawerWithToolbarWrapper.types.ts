import { HTMLElementProps } from '@leafygreen-ui/lib';

import { DrawerProps } from '../Drawer/Drawer.types';

type PickedDrawerProps = Required<Pick<DrawerProps, 'displayMode'>>;

export interface DrawerWithToolbarWrapperProps
  extends HTMLElementProps<'div'>,
    PickedDrawerProps {
  /**
   * Determines if the Drawer instance is open or closed
   */
  isDrawerOpen: boolean;
}
