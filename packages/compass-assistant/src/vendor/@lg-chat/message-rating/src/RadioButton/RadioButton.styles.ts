import { css, cx } from '@mongodb-js/compass-components';
import { shim_Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import { shim_tokens } from '@mongodb-js/compass-components';
const { color, hoverRing, focusRing, InteractionState, Variant, spacing } =
  shim_tokens;

const getBaseContainerStyles = (theme: shim_Theme) => css`
  display: flex;
  height: 22px; // Matches X-Small Button height
  justify-content: center;
  align-items: center;
  gap: ${spacing[150]}px;
  flex-shrink: 0;
  align-self: stretch;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  z-index: 0;
  border: 1px solid ${palette.gray.dark1};
  background-color: ${color[theme].background[Variant.Secondary][
    InteractionState.Default
  ]};

  &:hover {
    box-shadow: ${hoverRing[theme].gray};
    ${theme === shim_Theme.Dark
      ? `background-color: ${palette.gray.dark1}`
      : ''};
  }

  &:focus-visible {
    box-shadow: ${focusRing[theme].default};
    ${theme === shim_Theme.Dark
      ? `background-color: ${palette.gray.dark1}`
      : ''};
  }
`;

const getCheckedStyles = (theme: shim_Theme) => css`
  background-color: ${color[theme].background[Variant.InversePrimary][
    InteractionState.Default
  ]};
  border-color: ${theme === shim_Theme.Dark ? palette.white : 'initial'};

  &:hover {
    background-color: ${color[theme].background[Variant.InversePrimary][
      InteractionState.Default
    ]};
    box-shadow: none;
  }

  &:focus-visible {
    background-color: ${color[theme].background[Variant.InversePrimary][
      InteractionState.Focus
    ]};
    box-shadow: none;
  }
`;

export const getContainerStyles = ({
  checked,
  className,
  theme,
}: {
  checked?: boolean;
  className?: string;
  theme: shim_Theme;
}) =>
  cx(
    getBaseContainerStyles(theme),
    {
      [getCheckedStyles(theme)]: checked,
    },
    className
  );

export const labelStyles = css`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: ${spacing[100]}px ${spacing[200]}px;
  height: 100%;
  cursor: pointer;
`;
