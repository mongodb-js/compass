import { PRIMARY_BUTTON_INTERACTIVE_GREEN } from '@mongodb-js/compass-components';
import { css, cx } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  color,
  InteractionState,
  Variant,
} from '@mongodb-js/compass-components';

export const getIconFill = ({
  disabled,
  theme,
}: {
  disabled: boolean;
  theme: Theme;
}) => {
  if (disabled) {
    return color[theme].icon[Variant.Disabled][InteractionState.Default];
  }

  return color[theme].icon[Variant.Primary][InteractionState.Default];
};

const getBaseIconButtonStyles = ({ theme }: { theme: Theme }) => {
  const darkMode = theme === Theme.Dark;
  return css`
    background-color: ${palette.green.dark2};
    border: 1px solid ${palette.green[darkMode ? 'base' : 'dark2']};
    color: ${palette.white};

    &:active,
    &:hover {
      background-color: ${PRIMARY_BUTTON_INTERACTIVE_GREEN};
      color: ${palette.white};
      box-shadow: 0 0 0 3px ${palette.green[darkMode ? 'dark3' : 'light2']};
    }

    &:focus-visible {
      background-color: ${PRIMARY_BUTTON_INTERACTIVE_GREEN};
      color: ${palette.white};
    }
  `;
};

const getDisabledIconButtonStyles = (theme: Theme) => css`
  background-color: ${color[theme].background[Variant.Disabled][
    InteractionState.Default
  ]};
  color: ${color[theme].icon[Variant.Disabled][InteractionState.Default]};
  border-color: ${color[theme].border[Variant.Disabled][
    InteractionState.Default
  ]};

  &:active,
  &:hover {
    background-color: ${color[theme].background[Variant.Disabled][
      InteractionState.Default
    ]};
    color: ${color[theme].icon[Variant.Disabled][InteractionState.Default]};
    box-shadow: none;
  }

  &:focus-visible {
    background-color: ${color[theme].background[Variant.Disabled][
      InteractionState.Default
    ]};
    color: ${color[theme].icon[Variant.Disabled][InteractionState.Default]};
  }
`;

export const getIconButtonStyles = ({
  disabled,
  theme,
}: {
  disabled: boolean;
  theme: Theme;
}) =>
  cx(getBaseIconButtonStyles({ theme }), {
    [getDisabledIconButtonStyles(theme)]: disabled,
  });
