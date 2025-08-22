import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  spacing,
  shim_transitionDuration,
} from '@mongodb-js/compass-components';

export const baseStyles = css`
  margin-bottom: ${spacing[4]}px;
  transition: opacity ${shim_transitionDuration.slower}ms ease-in;
`;

export const labelStyles = css`
  margin-bottom: ${spacing[2]}px;
`;

export const labelThemeStyles: Record<string> = {
  [shim_Theme.Dark]: css`
    color: ${palette.gray.light1};
  `,
  [shim_Theme.Light]: css`
    color: ${palette.gray.dark1};
  `,
};
