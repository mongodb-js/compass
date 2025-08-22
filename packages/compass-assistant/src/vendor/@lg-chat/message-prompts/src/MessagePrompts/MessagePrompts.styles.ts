import { css } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing, transitionDuration } from '@mongodb-js/compass-components';

export const baseStyles = css`
  margin-bottom: ${spacing[4]}px;
  transition: opacity ${transitionDuration.slower}ms ease-in;
`;

export const labelStyles = css`
  margin-bottom: ${spacing[2]}px;
`;

export const labelThemeStyles: Record<Theme, string> = {
  [Theme.Dark]: css`
    color: ${palette.gray.light1};
  `,
  [Theme.Light]: css`
    color: ${palette.gray.dark1};
  `,
};
