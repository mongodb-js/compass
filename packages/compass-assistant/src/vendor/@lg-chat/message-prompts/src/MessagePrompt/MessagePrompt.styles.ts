import { css } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { spacing, hoverRing, focusRing, transitionDuration } = shim_tokens;

export const baseStyles = css`
  display: block;
  padding: ${spacing[2]}px ${spacing[3]}px;
  margin-bottom: ${spacing[2]}px;
  border: 1px solid ${palette.green.dark1};
  border-radius: 12px;
  transition: all ${transitionDuration.slower}ms ease;
  box-shadow: none;
  outline: none;
  text-align: left;
  &:not(:last-of-type) {
    margin-bottom: ${spacing[1]}px;
  }
  &[aria-disabled='false'][aria-pressed='false'] {
    cursor: pointer;
  }
`;

export const themeStyles: Record<shim_Theme, string> = {
  [shim_Theme.Dark]: css`
    background: ${palette.black};
    color: ${palette.gray.light2};

    &[aria-pressed='false'][aria-disabled='false']:hover {
      box-shadow: ${hoverRing.dark.green};
    }

    &[aria-pressed='false'][aria-disabled='false']:focus-visible {
      box-shadow: ${focusRing.dark.default};
    }
  `,
  [shim_Theme.Light]: css`
    background: ${palette.white};
    color: ${palette.gray.dark3};

    &[aria-pressed='false'][aria-disabled='false']:hover {
      box-shadow: ${hoverRing.light.green};
    }

    &[aria-pressed='false'][aria-disabled='false']:focus-visible {
      box-shadow: ${focusRing.light.default};
    }
  `,
};

export const disabledStyles: Record<shim_Theme, string> = {
  [shim_Theme.Dark]: css`
    border-color: ${palette.gray.dark1};
    color: ${palette.gray.dark1};
    background: ${palette.gray.dark3};
  `,
  [shim_Theme.Light]: css`
    border-color: ${palette.gray.base};
    color: ${palette.gray.base};
  `,
};

export const selectedStyles = css`
  box-shadow: 0 0 0 2px ${palette.green.dark1};
`;
