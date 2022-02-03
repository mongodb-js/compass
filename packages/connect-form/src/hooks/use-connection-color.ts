import { useCallback } from 'react';

type ColorCode = `color${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;

const COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP: Record<ColorCode, string> = {
  color1: '#00A35C', // green.dark1
  color2: '#71F6BA', // green.light1
  color3: '#016BF8', // blue.base
  color4: '#0498EC', // blue.light1
  color5: '#FFC010', // yellow.base
  color6: '#EF5752', // red.light1
  color7: '#B45AF2', // purple.base
  color8: '#F1D4FD', // purple.light2
  color9: '#889397', // gray.base
  color10: '#C1C7C6', // gray.light1
};

const LEGACY_COLORS_TO_COLOR_CODE_MAP: Record<string, ColorCode> = {
  '#5fc86e': 'color1',
  '#326fde': 'color2',
  '#deb342': 'color3',
  '#d4366e': 'color4',
  '#59c1e2': 'color5',
  '#2c5f4a': 'color6',
  '#d66531': 'color7',
  '#773819': 'color8',
  '#3b8196': 'color9',
  '#ababab': 'color10',
};

export const CONNECTION_COLOR_CODES = Object.keys(
  COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP
) as ColorCode[];

function isColorCode(hexOrColorCode: string | undefined): boolean {
  return CONNECTION_COLOR_CODES.includes(hexOrColorCode as ColorCode);
}

export function legacyColorsToColorCode(
  hexOrColorCode: string | undefined
): ColorCode | undefined {
  if (!hexOrColorCode) {
    return;
  }

  if (isColorCode(hexOrColorCode)) {
    return hexOrColorCode as ColorCode;
  }

  return LEGACY_COLORS_TO_COLOR_CODE_MAP[hexOrColorCode];
}

export function useConnectionColor(): {
  connectionColorToHex: (colorCode: string | undefined) => string | undefined;
} {
  const colorCodeToHex = useCallback(
    (colorCode: string | undefined): string | undefined => {
      if (!colorCode) {
        return;
      }

      const migratedColor = legacyColorsToColorCode(colorCode);
      if (!migratedColor) {
        return;
      }

      return COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP[migratedColor];
    },
    []
  );

  return {
    connectionColorToHex: colorCodeToHex,
  };
}
