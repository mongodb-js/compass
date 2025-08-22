import { css } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';

export const textAvatarStyleOverrides = css`
  background-color: ${palette.gray.dark1};
  border: unset;
`;

export const iconAvatarStyleOverrides = (theme: Theme) => css`
  background-color: ${theme === Theme.Dark
    ? palette.gray.dark2
    : palette.gray.base};

  color: ${theme === Theme.Dark ? palette.gray.light1 : palette.white};

  border: unset;
`;

export const logoAvatarStyleOverrides = (theme: Theme) => css`
  background-color: ${theme === Theme.Dark
    ? palette.green.dark3
    : palette.black};
`;
