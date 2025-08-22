import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  color,
  focusRing,
  hoverRing,
  InteractionState,
  spacing,
  Variant,
} from '@mongodb-js/compass-components';

const getBaseContainerStyles = (theme: Theme) => css`
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
    ${theme === Theme.Dark ? `background-color: ${palette.gray.dark1}` : ''};
  }

  &:focus-visible {
    box-shadow: ${focusRing[theme].default};
    ${theme === Theme.Dark ? `background-color: ${palette.gray.dark1}` : ''};
  }
`;

const getCheckedStyles = (theme: Theme) => css`
  background-color: ${color[theme].background[Variant.InversePrimary][
    InteractionState.Default
  ]};
  border-color: ${theme === Theme.Dark ? palette.white : 'initial'};

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
  theme: Theme;
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
