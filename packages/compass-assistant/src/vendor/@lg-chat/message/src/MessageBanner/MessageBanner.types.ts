import { BannerVariant, shim_lib } from '@mongodb-js/compass-components';

export interface MessageBannerProps
  extends shim_lib.HTMLElementProps<'div', never>,
    shim_lib.DarkModeProps {
  /**
   * Determines the color and glyph of the MessageBanner.
   * @default Variant.Info
   */
  variant?: BannerVariant;

  /**
   * The content inside of the MessageBanner.
   */
  children: React.ReactNode;
}
