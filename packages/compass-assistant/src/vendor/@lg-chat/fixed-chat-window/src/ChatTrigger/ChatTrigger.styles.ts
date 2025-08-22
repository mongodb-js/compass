import { css } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  focusRing,
  hoverRing,
  spacing,
  transitionDuration,
} from '@mongodb-js/compass-components';

export const baseStyles = css`
  border-radius: 40px;
  padding: 0px;
  outline: none;
  border-style: solid;
  cursor: pointer;
  transition: box-shadow ${transitionDuration.slower}ms ease-in-out;
`;

export const themeStyles: Record<Theme, string> = {
  [Theme.Dark]: css`
    border-color: ${palette.green.dark1};
    background-color: ${palette.black};
    color: ${palette.green.light1};
    &:hover {
      box-shadow: ${hoverRing.dark.green};
    }

    &:focus-visible {
      box-shadow: ${focusRing.dark.default};
    }
  `,
  [Theme.Light]: css`
    border-color: ${palette.green.dark1};
    background-color: ${palette.white};
    color: ${palette.green.dark2};

    &:hover {
      box-shadow: ${hoverRing.light.green};
    }

    &:focus-visible {
      box-shadow: ${focusRing.light.default};
    }
  `,
};

export const contentContainerStyles = css`
  display: flex;
  gap: ${spacing[2]}px;
  align-items: center;
  padding: 12px ${spacing[3]}px;
`;

export const buttonTextStyles = css`
  color: inherit;
`;
