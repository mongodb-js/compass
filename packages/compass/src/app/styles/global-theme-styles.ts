import { injectGlobal, css, uiColors, compassUIColors, Theme } from '@mongodb-js/compass-components';

const globalDefaultThemeStyles = css({
  ':root': {
    backgroundColor: compassUIColors.gray8,
    color: uiColors.gray.dark2,
  }
});

const globalLightThemeStyles = css({
  [`:root[data-theme="${Theme.Light}"]`]: {
    backgroundColor: compassUIColors.gray8,
    color: uiColors.gray.dark2,
  }
});

const globalDarkThemeStyles = css({
  [`:root[data-theme="${Theme.Dark}"]`]: {
    backgroundColor: uiColors.gray.dark3,
    color: uiColors.white,
  }
});

export function injectCompassGlobalThemeStyles(): void {
  injectGlobal(
    globalDefaultThemeStyles,
    globalLightThemeStyles,
    globalDarkThemeStyles
  );
}

export function applyGlobalLightThemeStyles(): void {
  document.documentElement.setAttribute('data-theme', Theme.Light);
}

export function applyGlobalDarkThemeStyles(): void {
  document.documentElement.setAttribute('data-theme', Theme.Dark);
}
