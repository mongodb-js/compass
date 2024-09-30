import { useCallback } from 'react';
import { palette, useDarkMode } from '@mongodb-js/compass-components';

type ColorCode = `color${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10}`;
export const DefaultColorCode = 'color10';

const PALETTE = {
  DARK: {
    ACTIVE: {
      color1: '#174933',
      color2: '#084843',
      color3: '#004074',
      color4: '#303374',
      color5: '#48295C',
      color6: '#611623',
      color7: '#591C47',
      color8: '#562800',
      color9: '#433500',
      color10: palette.gray.light2,
    },
    DEFAULT: {
      color1: '#113B29',
      color2: '#023B37',
      color3: '#003362',
      color4: '#262A65',
      color5: '#3D224E',
      color6: '#500F1C',
      color7: '#4B143D',
      color8: '#462100',
      color9: '#362B00',
      color10: palette.gray.light2,
    },
  },
  LIGHT: {
    ACTIVE: {
      color1: '#C4E8D1',
      color2: '#B8EAE0',
      color3: '#C2E5FF',
      color4: '#DADCFF',
      color5: '#EAD5F9',
      color6: '#FFCDCE',
      color7: '#F6CEE7',
      color8: '#FFD19A',
      color9: '#FFE770',
      color10: palette.gray.light2,
    },
    DEFAULT: {
      color1: '#D6F1DF',
      color2: '#CCF3EA',
      color3: '#D5EFFF',
      color4: '#E6E7FF',
      color5: '#F2E2FC',
      color6: '#FFDBDC',
      color7: '#FBDCEF',
      color8: '#FFDFB5',
      color9: '#FFF394',
      color10: palette.gray.light1,
    },
  },
} as const;

const COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP: Record<ColorCode, string> = {
  color1: palette.green.dark1,
  color2: palette.green.light1,
  color3: palette.blue.base,
  color4: palette.blue.light1,
  color5: palette.yellow.base,
  color6: palette.red.light1,
  color7: palette.purple.base,
  color8: palette.purple.light2,
  color9: palette.gray.base,
  color10: palette.gray.light1,
};

export const COLOR_CODE_TO_NAME: Record<ColorCode, string> = {
  color1: 'Green',
  color2: 'Teal',
  color3: 'Blue',
  color4: 'Iris',
  color5: 'Purple',
  color6: 'Red',
  color7: 'Pink',
  color8: 'Orange',
  color9: 'Yellow',
  color10: 'Gray',
};

export const CONNECTION_COLOR_CODES = Object.keys(
  COLOR_CODES_TO_UI_COLORS_DARK_THEME_MAP
) as ColorCode[];

function isColorCode(
  hexOrColorCode: string | undefined
): hexOrColorCode is ColorCode {
  return CONNECTION_COLOR_CODES.includes(hexOrColorCode as ColorCode);
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

  const colorCodeToHex = useCallback(
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

  const colorToName = useCallback(
    (colorCode: string | undefined): string | undefined => {
      if (!colorCode || !isColorCode(colorCode)) {
        return;
      }

      return COLOR_CODE_TO_NAME[colorCode];
    },
    []
  );

  const connectionColorCodes = () => CONNECTION_COLOR_CODES.slice(0, 9);

  return {
    connectionColorToHex: colorCodeToHex,
    connectionColorToHexActive: connectionColorToHexActive,
    connectionColorToName: colorToName,
    connectionColorCodes,
  };
}
