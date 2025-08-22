import React from 'react';

import { shim_lib } from '@mongodb-js/compass-components';

export const Align = {
  Center: 'center',
  Left: 'left',
} as const;

export type Align = typeof Align[keyof typeof Align];

export interface TitleBarProps
  extends Omit<shim_lib.HTMLElementProps<'div'>, 'children'>,
    shim_lib.DarkModeProps {
  /**
   * Title text
   */
  title: string;
  /**
   * Alignment of the title text and badge
   * @default Align.Left
   */
  align?: Align;
  /**
   * Badge text rendered to indicate 'Beta' or 'Experimental' flags
   */
  badgeText?: string;
  /**
   * Event handler called when the close button is clicked
   */
  onClose?: React.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;

  /**
   * Slot for custom close icon
   */
  iconSlot?: React.ReactNode;
}
