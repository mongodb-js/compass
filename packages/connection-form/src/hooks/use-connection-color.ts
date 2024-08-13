import { useCallback } from 'react';
import { usePreference } from 'compass-preferences-model/provider';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

type ColorCode = `color${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;
export const DefaultColorCode = 'color10';

const PALETTE = {
  DARK: {
    ACTIVE: {
      color1: '#611623',
      color2: '#591C47',
      color3: '#562800',
      color4: '#433500',
      color5: '#174933',
      color6: '#084843',
      color7: '#004074',
      color8: '#303374',
      color9: '#48295C',
      color10: palette.gray.light2,
    },
    DEFAULT: {
      color1: '#500F1C',
      color2: '#4B143D',
      color3: '#462100',
      color4: '#362B00',
      color5: '#113B29',
      color6: '#023B37',
      color7: '#003362',
      color8: '#262A65',
      color9: '#3D224E',
      color10: palette.gray.light2,
    },
  },
  LIGHT: {
    ACTIVE: {
      color1: '#FFCDCE',
      color2: '#F6CEE7',
      color3: '#FFD19A',
      color4: '#FFE770',
      color5: '#C4E8D1',
      color6: '#B8EAE0',
      color7: '#C2E5FF',
      color8: '#DADCFF',
      color9: '#EAD5F9',
      color10: palette.gray.light2,
    },
    DEFAULT: {
      color1: '#FFDBDC',
      color2: '#FBDCEF',
      color3: '#FFDFB5',
      color4: '#FFF394',
      color5: '#D6F1DF',
      color6: '#CCF3EA',
      color7: '#D5EFFF',
      color8: '#E6E7FF',
      color9: '#F2E2FC',
      color10: palette.gray.light1,
    },
  },
} as const;

const COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP: Record<ColorCode, string> = {
  color2: palette.green.light1,
  color3: palette.blue.base,
  color4: palette.blue.light1,
  color5: palette.yellow.base,
  color6: palette.red.light1,
  color7: palette.purple.base,
  color8: palette.purple.light2,
  color9: palette.gray.base,
  // COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP is used as the list of color codes
  // in the UI via CONNECTION_COLOR_CODES as connectionColorCodes and color1 is
  // Red in light mode. We don't want Red to be too prominent because it might
  // look like an error, but some users specifically want a Red option to
  // highlight something like a production server so we don't want to remove it
  // either. So we move it from the start of the color wheel to the end, taking
  // advantage of how it wraps around. That way it is still there for when users
  // need it, but not the most prominent one.
  color1: palette.green.dark1,
  // NOTE: color 10 gets sliced off for the multiple connections world in
  // connectionColorCodes below
  color10: palette.gray.light1,
};

export const COLOR_CODE_TO_NAME: Record<ColorCode, string> = {
  color1: 'Red',
  color2: 'Pink',
  color3: 'Orange',
  color4: 'Yellow',
  color5: 'Green',
  color6: 'Teal',
  color7: 'Blue',
  color8: 'Iris',
  color9: 'Purple',
  color10: 'Gray',
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

function isColorCode(
  hexOrColorCode: string | undefined
): hexOrColorCode is ColorCode {
  return CONNECTION_COLOR_CODES.includes(hexOrColorCode as ColorCode);
}

export function legacyColorsToColorCode(
  hexOrColorCode: string | undefined
): ColorCode | undefined {
  if (!hexOrColorCode) {
    return;
  }

  if (isColorCode(hexOrColorCode)) {
    return hexOrColorCode;
  }

  return LEGACY_COLORS_TO_COLOR_CODE_MAP[hexOrColorCode];
}

export function useConnectionColor(): {
  connectionColorCodes: () => ColorCode[];
  connectionColorToHex: (colorCode: string | undefined) => string | undefined;
  connectionColorToHexActive: (
    colorCode: string | undefined
  ) => string | undefined;
  connectionColorToName: (colorCode: string | undefined) => string | undefined;
} {
  const isDarkMode = useDarkMode();

  const newColorCodeToHex = useCallback(
    (colorCode: string | undefined): string | undefined => {
      if (!colorCode || !isColorCode(colorCode)) {
        return;
      }

      if (isDarkMode) {
        return PALETTE.DARK.DEFAULT[colorCode];
      }
      return PALETTE.LIGHT.DEFAULT[colorCode];
    },
    [isDarkMode]
  );

  const connectionColorToHexActive = useCallback(
    (colorCode: string | undefined): string | undefined => {
      if (!colorCode || !isColorCode(colorCode)) {
        return;
      }

      if (isDarkMode) {
        return PALETTE.DARK.ACTIVE[colorCode];
      }
      return PALETTE.LIGHT.ACTIVE[colorCode];
    },
    [isDarkMode]
  );

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

  const colorToName = useCallback(
    (colorCode: string | undefined): string | undefined => {
      if (!colorCode || !isColorCode(colorCode)) {
        return;
      }

      return COLOR_CODE_TO_NAME[colorCode];
    },
    []
  );

  const isMultiConnectionEnabled = usePreference(
    'enableNewMultipleConnectionSystem'
  );

  const connectionColorCodes = () => {
    if (isMultiConnectionEnabled) {
      return CONNECTION_COLOR_CODES.slice(0, 9);
    } else {
      return CONNECTION_COLOR_CODES;
    }
  };

  return {
    connectionColorToHex: isMultiConnectionEnabled
      ? newColorCodeToHex
      : colorCodeToHex,
    connectionColorToHexActive: connectionColorToHexActive,
    connectionColorToName: colorToName,
    connectionColorCodes,
  };
}
