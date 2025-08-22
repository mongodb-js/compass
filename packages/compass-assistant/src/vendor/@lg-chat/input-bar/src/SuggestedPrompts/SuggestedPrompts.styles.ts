import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';

export const themeStyles: Record<string> = {
  [shim_Theme.Light]: css`
    & + & {
      border-top: 1px solid ${palette.gray.light2};
    }
  `,
  [shim_Theme.Dark]: css`
    & + & {
      border-top: 1px solid ${palette.gray.dark2};
    }
  `,
};

export const suggestedPromptsLabelWrapperStyle = css`
  padding-bottom: 0;
`;

export const suggestedPromptsLabelStyle: Record<string> = {
  [shim_Theme.Light]: css`
    color: ${palette.gray.dark1};
  `,
  [shim_Theme.Dark]: css`
    color: ${palette.gray.base};
  `,
};
