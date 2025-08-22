import { shim_lib } from '@mongodb-js/compass-components';
import { shim_lib } from '@mongodb-js/compass-components';

import { type RichLinkProps } from '..';

export interface RichLinksAreaProps
  extends shim_lib.HTMLElementProps<'div', never>,
    shim_lib.DarkModeProps {
  links: Array<RichLinkProps>;

  /**
   * A callback function that is called when any link is clicked.
   */
  onLinkClick?: RichLinkProps['onLinkClick'];
}
