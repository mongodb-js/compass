import createCache from '@emotion/cache';
import { cache, css, uiColors, compassUIColors } from '@mongodb-js/compass-components';
import { serializeStyles } from '@emotion/serialize';

const globalThemeCache = createCache({
  key: 'global-compass-theme-cache'
});

const globalLightThemeStyles = css({
  body: {
    backgroundColor: compassUIColors.gray8,
    color: uiColors.gray.dark2,
  },
});

const globalDarkThemeStyles = css({
  body: {
    backgroundColor: uiColors.gray.dark3,
    color: uiColors.white,
  },
});

function injectThemedGlobal(
  ...args: string[]
): void {
  const serialized = serializeStyles(args, cache.registered);

  if (!globalThemeCache.inserted[serialized.name]) {
    globalThemeCache.insert('', serialized, globalThemeCache.sheet, true);
  }
}

export function flushThemedGlobals(): void {
  globalThemeCache.sheet.flush();
  globalThemeCache.inserted = {};
  globalThemeCache.registered = {};
}

export function applyGlobalLightThemeStyles(): void {
  injectThemedGlobal(globalLightThemeStyles);
}

export function applyGlobalDarkThemeStyles(): void {
  injectThemedGlobal(globalDarkThemeStyles);
}
