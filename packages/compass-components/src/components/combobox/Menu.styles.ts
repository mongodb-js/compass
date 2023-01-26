import { css, keyframes } from '@leafygreen-ui/emotion';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { fontFamilies, typeScales } from '@leafygreen-ui/tokens';

import { ComboboxSize } from './Combobox.types';

/** Height of a menu item (in px) */
export const menuItemHeight = 36;

export const menuItemPadding: Record<ComboboxSize, { x: number; y: number }> = {
  [ComboboxSize.Default]: { x: 12, y: 8 },
  [ComboboxSize.Large]: { x: 12, y: 8 },
};

/**
 * Menu styles
 */

export const popoverStyle = (width = 384) => css`
  border-radius: 4px;
  width: ${width}px;
  overflow: hidden;
`;

export const popoverThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    box-shadow: 0px 3px 7px rgba(0, 0, 0, 0.25);
  `,
  [Theme.Dark]: css``, // TODO: DarkMode
};

export const menuBaseStyle = css`
  position: relative;
  width: 100%;
  margin: 0;
  padding: 0;
  font-family: ${fontFamilies.default};
  border-radius: inherit;
  overflow-y: auto;
  scroll-behavior: smooth;
  min-height: ${menuItemHeight}px;
`;

export const menuThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    color: ${palette.gray.dark3};
    background-color: ${palette.white};
  `,
  [Theme.Dark]: css``, // TODO: DarkMode
};

export const menuList = css`
  position: relative;
  margin: 0;
  padding: 0;
`;

export const menuMessageBaseStyle = css`
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 8px;
`;

export const menuMessageThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    ${palette.gray.dark1}
  `,
  [Theme.Dark]: css``, // TODO: DarkMode
};

export const menuMessageSizeStyle: Record<ComboboxSize, string> = {
  [ComboboxSize.Default]: css`
    font-size: ${typeScales.body1.fontSize +
    1}px; // TODO: update this @ redesign
    line-height: ${typeScales.body1.lineHeight +
    1}px; // TODO: update this @ redesign
    padding: ${menuItemPadding[ComboboxSize.Default].y}px
      ${menuItemPadding[ComboboxSize.Default].x}px;
  `,
  [ComboboxSize.Large]: css`
    font-size: ${typeScales.body2.fontSize}px;
    line-height: ${typeScales.body2.lineHeight}px;
    padding: ${menuItemPadding[ComboboxSize.Large].y}px
      ${menuItemPadding[ComboboxSize.Large].x}px;
  `,
};

export const menuMessageIconSizeStyle: Record<ComboboxSize, string> = {
  [ComboboxSize.Default]: css`
    height: ${typeScales.body1.fontSize + 1}px; // TODO: update this @ redesign
    width: ${typeScales.body1.fontSize + 1}px; // TODO: update this @ redesign
  `,
  [ComboboxSize.Large]: css`
    height: ${typeScales.body2.fontSize}px;
    width: ${typeScales.body2.fontSize}px;
  `,
};

const loadingIconAnimation = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

export const loadingIconStyle = css`
  animation: ${loadingIconAnimation} 1.5s linear infinite;
`;
