import React from 'react';

import { Icon } from '@mongodb-js/compass-components';
// import { consoleOnce } from '@mongodb-js/compass-components';
import {
  MongoDBLogoMark,
  SupportedColors,
} from '@mongodb-js/compass-components';

import { AvatarProps, AvatarSize, Format } from '../Avatar.types';

import {
  getAvatarIconStyles,
  getAvatarLogoStyles,
  getAvatarTextStyles,
} from './AvatarContents.style';

const MAX_CHARS = 2;

export const AvatarContents = ({
  format,
  text,
  size = AvatarSize.Default,
  glyph = 'Person',
  sizeOverride,
}: AvatarProps) => {
  if (format === Format.Text && (!text || text.length <= 0)) {
    // consoleOnce.warn(
    //   'Avatar received `text` format without any `text` prop. Defaulting to `icon` format.'
    // );
    format = Format.Icon;
  }

  switch (format) {
    case Format.MongoDB: {
      return (
        <MongoDBLogoMark
          className={getAvatarLogoStyles({})}
          color={SupportedColors.GreenBase}
        />
      );
    }

    case Format.Text: {
      const isSingleCharacter = text?.length === 1;
      const truncatedText = text?.slice(0, MAX_CHARS);

      return (
        <span
          aria-hidden
          className={getAvatarTextStyles({
            size,
            sizeOverride,
            isSingleCharacter,
          })}
        >
          {truncatedText}
        </span>
      );
    }

    case Format.Icon:
    default: {
      return (
        <Icon
          size={size}
          glyph={glyph}
          className={getAvatarIconStyles({ sizeOverride })}
        />
      );
    }
  }
};
