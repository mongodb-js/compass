import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { spacing, Type: ColorType } = shim_tokens;

import { AvatarSize } from './Avatar.types';

export const avatarSizeMap = {
  [AvatarSize.Default]: spacing[400] + spacing[300], // 16 + 12 = 28
  [AvatarSize.Large]: spacing[900], // 36
  [AvatarSize.XLarge]: spacing[1000] + spacing[50], // 40 + 2 = 42
} as const as Record<AvatarSize, number>;

export const avatarFontSizeMap = {
  [AvatarSize.Default]: spacing[300], // 12
  [AvatarSize.Large]: spacing[400], // 16
  [AvatarSize.XLarge]: spacing[600], // 24
} as const as Record<AvatarSize, number>;

export const avatarMultiCharacterFontSizeMap = {
  [AvatarSize.Default]: spacing[200], // 8
  [AvatarSize.Large]: spacing[300], // 12
  [AvatarSize.XLarge]: spacing[400], // 16
} as const as Record<AvatarSize, number>;

export const avatarColors = {
  [shim_Theme.Light]: {
    [ColorType.Background]: palette.gray.base,
    [ColorType.Icon]: palette.white,
    [ColorType.Text]: palette.white,
    [ColorType.Border]: palette.gray.light3,
  },
  [shim_Theme.Dark]: {
    [ColorType.Background]: palette.gray.base,
    [ColorType.Icon]: palette.white,
    [ColorType.Text]: palette.white,
    [ColorType.Border]: palette.gray.dark4,
  },
} as const as Record<shim_Theme, Record<string, string>>;
