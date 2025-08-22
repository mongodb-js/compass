import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { spacing } from '@mongodb-js/compass-components';

export const baseStyles = css`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px ${spacing[4]}px;
  border-bottom: 1px solid;
`;

export const themeStyles: Record<string> = {
  [shim_Theme.Dark]: css`
    background-color: ${palette.black};
    border-color: ${palette.gray.dark2};
  `,
  [shim_Theme.Light]: css`
    background-color: ${palette.white};
    border-color: ${palette.gray.light2};
  `,
};

export const contentContainerStyles = css`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${spacing[2]}px;
`;

export const contentAlignmentStyles = css`
  margin: auto;
`;
