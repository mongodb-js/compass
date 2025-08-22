import {
  BannerVariant,
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

export interface MessageBannerProps
  extends HTMLElementProps<'div', never>,
    DarkModeProps {
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
