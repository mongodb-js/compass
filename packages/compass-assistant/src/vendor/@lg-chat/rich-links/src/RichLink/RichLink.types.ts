import {
  DarkModeProps,
  HTMLElementProps,
} from '@mongodb-js/compass-components';

import { RichLinkBadgeProps } from './RichLinkBadge/RichLinkBadge.types';
import { RichLinkVariantName } from './richLinkVariants';

export interface BaseRichLinkProps
  extends DarkModeProps,
    HTMLElementProps<'a', never> {
  /**
   * The text that shows on the rich link
   */
  children: string;

  /**
   * A URL for the background image of the rich link
   */
  imageUrl?: string;

  /**
   * A callback function that is called when the link is clicked.
   */
  onLinkClick?: (props: Omit<BaseRichLinkProps, 'onLinkClick'>) => void;
}

export interface RichLinkVariantControlProps {
  /**
   * The variant of the rich link. This uses a pre-defined badge and sets styles for a known link type.
   */
  variant: RichLinkVariantName;
}

export interface RichLinkBadgeControlProps {
  /**
   * The glyph of the badge
   */
  badgeGlyph: RichLinkBadgeProps['glyph'];

  /**
   * The label of the badge
   */
  badgeLabel: RichLinkBadgeProps['label'];

  /**
   * The variant of the badge. This determines its background, text, and icon color.
   */
  badgeColor?: RichLinkBadgeProps['color'];
}

export type RichLinkWithVariantProps = BaseRichLinkProps &
  RichLinkVariantControlProps;

export type RichLinkWithBadgeProps = BaseRichLinkProps &
  RichLinkBadgeControlProps;

export type RichLinkProps =
  | BaseRichLinkProps
  | RichLinkWithVariantProps
  | RichLinkWithBadgeProps;
