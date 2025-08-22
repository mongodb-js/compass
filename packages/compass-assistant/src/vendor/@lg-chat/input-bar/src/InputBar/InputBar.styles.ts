import { css, cx, keyframes } from '@mongodb-js/compass-components';
import { Theme } from '@mongodb-js/compass-components';
import { palette } from '@mongodb-js/compass-components';
import {
  BaseFontSize,
  borderRadius,
  color,
  focusRing,
  fontFamilies,
  fontWeights,
  InteractionState,
  spacing,
  transitionDuration,
  typeScales,
  Variant,
} from '@mongodb-js/compass-components';

/**
 * "adornment" refers to any element added to user interface (UI) primarily for
 * enhancing its visual appeal, providing supplementary information, or facilitating
 * interaction, but not fundamentally essential to the basic functionality.
 */
const ADORNMENT_CONTAINER_HEIGHT = 36;
const GRADIENT_WIDTH = 3;
const GRADIENT_OFFSET = 1;
const HOTKEY_INDICATOR_HEIGHT = 28;

const baseFormStyles = css`
  width: 100%;
`;

export const getFormStyles = (className?: string) =>
  cx(baseFormStyles, className);

export const outerFocusContainerStyles = css`
  position: relative;
`;

const baseFocusContainerStyles = css`
  border-radius: ${borderRadius[200]}px;
`;

const gradientAnimationStyles = css`
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: -${GRADIENT_WIDTH + GRADIENT_OFFSET}px;
    left: -${GRADIENT_WIDTH + GRADIENT_OFFSET}px;
    width: calc(100% + ${(GRADIENT_WIDTH + GRADIENT_OFFSET) * 2}px);
    height: calc(100% + ${(GRADIENT_WIDTH + GRADIENT_OFFSET) * 2}px);
    border-radius: ${borderRadius[300]}px;
    background-color: ${palette.blue.light1};
    background-size: 400% 400%;
    background-position: 800% 800%; // set final state of animation
  }

  &::after {
    animation: 4s animateBg linear;
  }

  &::before {
    filter: blur(4px) opacity(0.6);
    animation: 4s animateBg, animateShadow linear infinite;
    opacity: 0;
  }

  @keyframes animateBg {
    0% {
      background-position: 400% 400%;
      background-image: linear-gradient(
        20deg,
        ${palette.blue.light1} 0%,
        ${palette.blue.light1} 30%,
        #00ede0 45%,
        #00ebc1 75%,
        #0498ec
      );
    }
    100% {
      background-position: 0% 0%;
      background-image: linear-gradient(
        20deg,
        ${palette.blue.light1} 0%,
        ${palette.blue.light1} 30%,
        #00ede0 45%,
        #00ebc1 75%,
        #0498ec
      );
    }
  }

  @keyframes animateShadow {
    0% {
      opacity: 1;
    }
    100% {
      opacity: 0;
    }
  }
`;

const focusStyles = css`
  box-shadow: ${focusRing.light.input};
  border-color: transparent;
  transition: ${transitionDuration.default}ms ease-in-out;
  transition-property: border-color, box-shadow;
`;

export const getInnerFocusContainerStyles = ({
  disabled,
  isFocused,
  shouldRenderGradient,
}: {
  disabled: boolean;
  isFocused: boolean;
  shouldRenderGradient: boolean;
}) =>
  cx(baseFocusContainerStyles, {
    [gradientAnimationStyles]: shouldRenderGradient,
    [focusStyles]: !disabled && isFocused && !shouldRenderGradient,
  });

const getBaseContentWrapperStyles = ({
  isCompact,
  theme,
}: {
  isCompact: boolean;
  theme: Theme;
}) => css`
  overflow: hidden;
  width: 100%;
  display: flex;
  flex-direction: ${isCompact ? 'column' : 'row'};
  position: relative;
  border-radius: ${borderRadius[200]}px;
  border: 1px solid ${palette.gray.base};
  z-index: 2;
  background-color: ${color[theme].background[Variant.Primary][
    InteractionState.Default
  ]};
  color: ${color[theme].text[Variant.Primary][InteractionState.Default]};

  &:disabled {
    cursor: not-allowed;

    &:hover,
    &:active {
      box-shadow: none;
    }
  }
`;

const getDisabledThemeStyles = (theme: Theme) => css`
  background-color: ${color[theme].background[Variant.Disabled][
    InteractionState.Default
  ]};
  border-color: ${color[theme].border[Variant.Disabled][
    InteractionState.Default
  ]};
  color: ${color[theme].text[Variant.Disabled][InteractionState.Default]};
`;

const contentWrapperFocusStyles = css`
  border-color: transparent;
`;

export const getContentWrapperStyles = ({
  disabled,
  isCompact,
  isFocused,
  theme,
}: {
  disabled: boolean;
  isCompact: boolean;
  isFocused: boolean;
  theme: Theme;
}) =>
  cx(getBaseContentWrapperStyles({ isCompact, theme }), {
    [getDisabledThemeStyles(theme)]: disabled,
    [contentWrapperFocusStyles]: isFocused,
  });

export const adornmentContainerStyles = css`
  height: ${ADORNMENT_CONTAINER_HEIGHT}px;
  display: flex;
  gap: ${spacing[200]}px;
  align-items: center;
  align-self: flex-start;
  padding: ${spacing[100]}px 0px ${spacing[100]}px ${spacing[200]}px;
`;

const getBaseTextAreaStyles = ({
  isCompact,
  theme,
}: {
  isCompact: boolean;
  theme: Theme;
}) => css`
  flex: ${isCompact ? 'initial' : 1};
  font-size: ${BaseFontSize.Body1}px;
  font-family: ${fontFamilies.default};
  font-weight: ${fontWeights.regular};
  padding: ${spacing[200]}px;
  outline: none;
  border: none;
  transition: ${transitionDuration.default}ms ease-in-out;
  transition-property: border-color, box-shadow;
  overflow-y: scroll;
  resize: none; // to remove bottom right diagonal lines
  box-sizing: content-box;
  line-height: ${typeScales.body1.lineHeight}px;
  background-color: inherit;
  color: inherit;
  margin: 0; // firefox creates margins on textareas - remove it for consistent sizing
  background-color: ${color[theme].background[Variant.Primary][
    InteractionState.Default
  ]};
  color: ${color[theme].text[Variant.Primary][InteractionState.Default]};

  &:disabled {
    ${getDisabledThemeStyles(theme)};

    &::placeholder {
      color: inherit;
    }

    &:disabled:-webkit-autofill {
      &,
      &:hover,
      &:focus {
        appearance: none;
        -webkit-text-fill-color: ${palette.gray.base};
      }
    }
  }
`;

export const getTextAreaStyles = ({
  className,
  isCompact,
  theme,
}: {
  className?: string;
  isCompact: boolean;
  theme: Theme;
}) => cx(getBaseTextAreaStyles({ isCompact, theme }), className);

export const actionContainerStyles = css`
  display: flex;
  align-items: flex-end;
  align-self: flex-end;
  gap: ${spacing[200]}px;
  padding: ${spacing[100]}px;
`;

const baseHotkeyIndicatorStyles = css`
  padding: ${spacing[100]}px ${spacing[400]}px;
  border-radius: ${borderRadius[400]}px;
  height: ${HOTKEY_INDICATOR_HEIGHT}px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: default;
  user-select: none;
`;

const hotkeyIndicatorThemeStyles = {
  [Theme.Dark]: css`
    background-color: ${palette.gray.dark4};
    border: 1px solid ${palette.gray.dark2};
    color: ${palette.gray.light2};
  `,
  [Theme.Light]: css`
    background-color: ${palette.gray.light2};
    border: 1px solid ${palette.gray.light2};
    color: ${palette.green.dark2};
  `,
};

const vanishAnimation = keyframes`
  from {
    display: flex;
    opacity: 1;
  }
  to {
    display: none;
    opacity: 0;
  }
`;

const hotkeyIndicatorFocusedStyles = css`
  opacity: 0;
  animation: ${vanishAnimation} ${transitionDuration.default}ms forwards;
`;

const appearAnimation = keyframes`
  from {
    opacity: 0;
    display: none;
  }
  to {
    opacity: 1;
    display: flex;
  }
`;

const hotkeyIndicatorUnfocusedStyles = css`
  opacity: 1;
  animation: ${appearAnimation} ${transitionDuration.default}ms forwards;
`;

export const getHotkeyIndicatorStyles = ({
  isFocused,
  theme,
}: {
  isFocused: boolean;
  theme: Theme;
}) =>
  cx(baseHotkeyIndicatorStyles, hotkeyIndicatorThemeStyles[theme], {
    [hotkeyIndicatorFocusedStyles]: isFocused,
    [hotkeyIndicatorUnfocusedStyles]: !isFocused,
  });
