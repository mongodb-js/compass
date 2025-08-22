import { type RichLinkProps } from '@lg-chat/rich-links';

import { shim_lib } from '@mongodb-js/compass-components';

export interface MessageLinksProps
  extends shim_lib.DarkModeProps,
    Omit<shim_lib.HTMLElementProps<'div'>, 'children'> {
  /**
   * The text to display as the heading of the links section.
   */
  headingText?: string;

  /**
   * A callback function that is called when any link is clicked.
   */
  onLinkClick?: RichLinkProps['onLinkClick'];

  /**
   * An list of link data to render in the links section.
   */
  links: Array<RichLinkProps>;
}
