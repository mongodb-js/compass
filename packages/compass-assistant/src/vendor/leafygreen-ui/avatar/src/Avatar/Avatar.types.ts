import { ComponentProps } from 'react';
import omit from 'lodash/omit';

import { GlyphName, shim_lib } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { Size } = shim_tokens;

export const Format = {
  /** Renders a MongoDB logo mark */
  MongoDB: 'mongodb',

  /** Renders the user's given name initial */
  Text: 'text',

  /** Renders a `Person` icon */
  Icon: 'icon',

  /** TODO: Renders an image avatar */
  // Image: 'image',
} as const;
export type Format = typeof Format[keyof typeof Format];

export const AvatarSize = {
  ...omit(Size, ['XSmall', 'Small']),
  XLarge: 'xlarge',
} as const;
export type AvatarSize = typeof AvatarSize[keyof typeof AvatarSize];

export interface BaseAvatarProps
  extends ComponentProps<'div'>,
    shim_lib.DarkModeProps {
  /**
   * The relative Size of tha Avatar
   *
   * @default `'default'`
   */
  size?: AvatarSize;

  /**
   * Renders the Avatar at a specific pixel size, not supported by the {@link AvatarSize} map
   */
  sizeOverride?: number;
}

/**
 * A discriminated union of Avatar props for each {@link Format} value
 */
export type DiscriminatedAvatarProps =
  | {
      /**
       * The format of the avatar. Can be one of `mongodb`, `text`, or `icon`.
       */
      format: typeof Format.Text;

      /**
       * The text to render in the Avatar when `format === 'text'`
       */
      text: string | null;

      /**
       * The LeafyGreen icon glyph name to render in the Avatar when `format === 'icon'`
       *
       * @default `"Person"`
       */
      glyph?: GlyphName;
    }
  | {
      /**
       * The format of the avatar. Can be one of `mongodb`, `text`, or `icon`.
       */
      format: typeof Format.Icon;

      /**
       * The LeafyGreen icon glyph name to render in the Avatar when `format === 'icon'`
       *
       * @default `"Person"`
       */
      glyph?: GlyphName;

      /**
       * The text to render in the Avatar when `format === 'text'`
       */
      text?: string | null;
    }
  | {
      /**
       * The format of the avatar. Can be one of `mongodb`, `text`, or `icon`.
       */
      format: typeof Format.MongoDB;

      /**
       * The text to render in the Avatar when `format === 'text'`
       */
      text?: string | null;

      /**
       * The LeafyGreen icon glyph name to render in the Avatar when `format === 'icon'`
       *
       * @default `"Person"`
       */
      glyph?: GlyphName;
    };
// TODO: image Avatar
// | {
//     format: typeof Format.Image;
//     imageUrl: string;
//     text: never;
//     glyph: never;
//   };

export type AvatarProps = BaseAvatarProps & DiscriminatedAvatarProps;

export interface AvatarStyleArgs {
  size?: AvatarSize;
  theme?: shim_Theme;
  format?: Format;
  sizeOverride?: number;
}
