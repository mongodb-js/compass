import { css } from '@leafygreen-ui/emotion';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { spacing } from '@leafygreen-ui/tokens';

import { avatarColors, avatarSizeMap } from './Avatar.constants';
import { AvatarSize, AvatarStyleArgs, Format } from './Avatar.types';

export const getAvatarStyles = ({
  format,
  theme = Theme.Light,
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
      background-color: ${theme === Theme.Dark
        ? palette.green.dark3
        : palette.black};
      color: ${palette.green.base};
      border: unset;
    `}
  `;
};
