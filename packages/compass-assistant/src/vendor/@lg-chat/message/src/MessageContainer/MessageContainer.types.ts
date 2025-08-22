import { shim_lib } from '@mongodb-js/compass-components';

export const Variant = {
  Primary: 'primary',
  Secondary: 'secondary',
} as const;
export type Variant = typeof Variant[keyof typeof Variant];

export interface MessageContainerProps
  extends shim_lib.HTMLElementProps<'div'>,
    shim_lib.DarkModeProps {
  /**
   * Determines the styles of the message container
   * @default Variant.Primary
   */
  variant?: Variant;
}
