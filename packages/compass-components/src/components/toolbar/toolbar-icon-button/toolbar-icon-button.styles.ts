import { css, cx } from '@leafygreen-ui/emotion';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { borderRadius } from '@leafygreen-ui/tokens';

import { ICON_BUTTON_HEIGHT } from '../constants';

export const baseIconButtonStyles = css`
  &,
  &:hover,
  &[data-hover='true'],
  &::before {
    border-radius: ${borderRadius[150]}px;
  }
`;

export const getIconButtonActiveStyles = ({ theme }: { theme: Theme }) =>
  cx(
    css`
      background: ${theme === Theme.Light
        ? palette.green.light3
        : palette.green.dark3};

      color: ${theme === Theme.Light
        ? palette.green.dark2
        : palette.green.light1};
    `
  );

export const getIconButtonStyles = ({
  active,
  theme,
  disabled,
  className,
}: {
  active: boolean;
  theme: Theme;
  disabled: boolean;
  className?: string;
}) =>
  cx(
    css`
      ${baseIconButtonStyles}
    `,
    {
      [getIconButtonActiveStyles({ theme })]: active && !disabled,
    },
    className
  );

export const triggerStyles = css`
  display: flex;
  height: ${ICON_BUTTON_HEIGHT}px;
  align-items: center;
`;
