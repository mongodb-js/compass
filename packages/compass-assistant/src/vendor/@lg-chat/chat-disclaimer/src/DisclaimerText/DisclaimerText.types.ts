import { HTMLElementProps } from '@mongodb-js/compass-components';

export interface DisclaimerTextProps extends HTMLElementProps<'div'> {
  /**
   * Heading text
   */
  title?: string;
}
