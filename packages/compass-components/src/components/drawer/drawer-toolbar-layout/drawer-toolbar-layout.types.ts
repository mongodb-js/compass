import type React from 'react';

import type { DarkModeProps, LgIdProps } from '@leafygreen-ui/lib';
import type { ToolbarIconButtonProps } from '../../toolbar';

import type { DrawerProps } from '../drawer/drawer.types';

type PickedOptionalDrawerProps = Pick<DrawerProps, 'onClose' | 'displayMode'>;
type PickedRequiredToolbarIconButtonProps = Pick<
  ToolbarIconButtonProps,
  'glyph' | 'label' | 'onClick' | 'disabled'
>;

interface LayoutBase extends PickedRequiredToolbarIconButtonProps {
  /**
   * The id of the layout. This is used to open the drawer.
   */
  id: string;
}

interface LayoutWithContent extends LayoutBase {
  /**
   * The title of the drawer. This is not required if the toolbar item should not open a drawer.
   */
  title: React.ReactNode;

  /**
   * The content of the drawer. This is not required if the toolbar item should not open a drawer.
   */
  content: React.ReactNode;
}

interface LayoutWithoutContent extends LayoutBase {
  /**
   * The title of the drawer. This is not required if the toolbar item should not open a drawer.
   */
  title?: never;

  /**
   * The content of the drawer. This is not required if the toolbar item should not open a drawer.
   */
  content?: never;
}

export type LayoutData = LayoutWithContent | LayoutWithoutContent;

export type DrawerToolbarLayoutProps = PickedOptionalDrawerProps &
  DarkModeProps &
  LgIdProps & {
    /**
     * An array of data that will be used to render the toolbar items and the drawer content.
     */
    toolbarData: Array<LayoutData>;
    className?: string;
    children: React.ReactNode;
  };

export type DrawerToolbarLayoutContainerProps = DrawerToolbarLayoutProps;
