import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

export const Variant = {
  Primary: 'primary',
  Secondary: 'secondary',
} as const;
export type Variant = typeof Variant[keyof typeof Variant];

export interface MessageContainerProps
  extends HTMLElementProps<'div'>,
    DarkModeProps {
  /**
   * Determines the styles of the message container
   * @default Variant.Primary
   */
  variant?: Variant;
}
