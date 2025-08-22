import { shim_button } from '@mongodb-js/compass-components';

export interface ScrollToLatestButtonProps extends shim_button.ButtonProps {
  /**
   * Whether the button is visible
   */
  visible: boolean;
}
