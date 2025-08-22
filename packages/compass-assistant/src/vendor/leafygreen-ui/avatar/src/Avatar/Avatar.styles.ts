import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

import { avatarColors, avatarSizeMap } from './Avatar.constants';
import { AvatarSize, AvatarStyleArgs, Format } from './Avatar.types';

export const getAvatarStyles = ({
  format,
  theme = shim_Theme.Light,
  size = AvatarSize.Default,
  sizeOverride,
}: AvatarStyleArgs) => {
  const sizePx = sizeOverride ?? avatarSizeMap[size];

  return css`
    height: ${sizePx}px;
    width: ${sizePx}px;
    min-height: ${sizePx}px;
    min-width: ${sizePx}px;
    border-radius: 100%;
    border: ${spacing[50]}px solid;

    display: flex;
    align-items: center;
    justify-content: center;

    background-color: ${avatarColors[theme].background};
    color: ${avatarColors[theme].text};
    border-color: ${avatarColors[theme].border};

    ${format === Format.MongoDB &&
    css`
      background-color: ${theme === shim_Theme.Dark
        ? palette.green.dark3
        : palette.black};
      color: ${palette.green.base};
      border: unset;
    `}
  `;
};
