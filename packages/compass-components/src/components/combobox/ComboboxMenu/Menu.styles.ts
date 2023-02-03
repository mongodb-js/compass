import { transparentize } from 'polished';

import { css, keyframes } from '@leafygreen-ui/emotion';
import { Theme } from '@leafygreen-ui/lib';
import { palette } from '@leafygreen-ui/palette';
import { fontFamilies, spacing, typeScales } from '@leafygreen-ui/tokens';

import { ComboboxSize as Size } from '../Combobox.types';

export const menuItemPadding: Record<Size, { x: number; y: number }> = {
  [Size.Default]: { x: 12, y: 8 },
  [Size.Large]: { x: 12, y: 8 },
};

/** Height of a menu item (in px) */
export const menuItemHeight = {
  [Size.Default]:
    typeScales.body1.lineHeight + 2 * menuItemPadding[Size.Default].y,
  [Size.Large]: typeScales.body2.lineHeight + 2 * menuItemPadding[Size.Large].y,
};

/**
 * Menu styles
 */

export const popoverStyle = css`
  overflow: hidden;
  border-radius: 12px;
  border: 1px solid;
`;

export const popoverThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    box-shadow: 0px 4px 7px ${transparentize(0.85, palette.black)};
    border-color: ${palette.gray.light2};
  `,
  [Theme.Dark]: css`
    box-shadow: 0px 4px 7px ${transparentize(0.85, palette.black)};
    border-color: ${palette.gray.dark3};
  `,
};

export const menuBaseStyle = css`
  position: relative;
  width: 100%;
  margin: 0;
  padding: ${spacing[2]}px 0;
  font-family: ${fontFamilies.default};
  border-radius: inherit;
  overflow-y: auto;
  scroll-behavior: smooth;
`;

export const menuThemeStyle: Record<Theme, string> = {
  [Theme.Light]: css`
    color: ${palette.black};
    background-color: ${palette.white};
  `,
  [Theme.Dark]: css`
    color: ${palette.gray.light1};
    background-color: ${palette.gray.dark3};
  `,
};

export const menuSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    min-height: ${menuItemHeight[Size.Default]}px;
  `,
  [Size.Large]: css`
    min-height: ${menuItemHeight[Size.Large]}px;
  `,
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
    color: ${palette.gray.dark3};
  `,
  [Theme.Dark]: css`
    color: ${palette.gray.light3};
  `,
};

export const menuMessageSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    font-size: ${typeScales.body1.fontSize}px;
    line-height: ${typeScales.body1.lineHeight}px;
    padding: ${menuItemPadding[Size.Default].y}px
      ${menuItemPadding[Size.Default].x}px;
  `,
  [Size.Large]: css`
    font-size: ${typeScales.body2.fontSize}px;
    line-height: ${typeScales.body2.lineHeight}px;
    padding: ${menuItemPadding[Size.Large].y}px
      ${menuItemPadding[Size.Large].x}px;
  `,
};

export const menuMessageIconSizeStyle: Record<Size, string> = {
  [Size.Default]: css`
    height: ${typeScales.body1.fontSize}px;
    width: ${typeScales.body1.fontSize}px;
  `,
  [Size.Large]: css`
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
