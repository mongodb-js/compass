import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';

export const textAvatarStyleOverrides = css`
  background-color: ${palette.gray.dark1};
  border: unset;
`;

export const iconAvatarStyleOverrides = (theme: shim_Theme) => css`
  background-color: ${theme === shim_Theme.Dark
    ? palette.gray.dark2
    : palette.gray.base};

  color: ${theme === shim_Theme.Dark ? palette.gray.light1 : palette.white};

  border: unset;
`;

export const logoAvatarStyleOverrides = (theme: shim_Theme) => css`
  background-color: ${theme === shim_Theme.Dark
    ? palette.green.dark3
    : palette.black};
`;
