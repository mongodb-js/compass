import { useCallback } from 'react';
import { uiColors } from '..';

type ColorCode =
  | 'color1'
  | 'color2'
  | 'color3'
  | 'color4'
  | 'color5'
  | 'color6'
  | 'color7'
  | 'color8'
  | 'color9'
  | 'color10';

const COLOR_CODES_TO_UI_COLORS_MAP: Record<ColorCode, string> = {
  color1: uiColors.yellow.base,
  color2: uiColors.blue.light2,
  color3: '#F1D4FD', // purple is missing in the non rebranded palette
  color4: uiColors.red.light2,
  color5: uiColors.gray.light1,
  color6: uiColors.green.light2,
  color7: uiColors.green.base,
  color8: uiColors.yellow.light2,
  color9: uiColors.blue.light1,
  color10: uiColors.red.base,
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

export const COLOR_CODES = Object.keys(
  COLOR_CODES_TO_UI_COLORS_MAP
) as ColorCode[];

function isColorCode(hexOrColorCode: string | undefined) {
  return hexOrColorCode
    ? (COLOR_CODES as string[]).includes(hexOrColorCode)
    : undefined;
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

export function useColorCode(): {
  colorCodeToHex: (colorCode: string | undefined) => string | undefined;
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

      return COLOR_CODES_TO_UI_COLORS_MAP[migratedColor];
    },
    []
  );

  return {
    colorCodeToHex,
  };
}
