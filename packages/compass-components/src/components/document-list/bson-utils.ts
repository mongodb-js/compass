import type { TypeCastMap } from 'hadron-type-checker';
import { useMemo } from 'react';
import { variantColors } from '@leafygreen-ui/code';

import type { Theme } from '../../hooks/use-theme';
import { Themes, useDarkMode } from '../../hooks/use-theme';

type BSONValueType = keyof TypeCastMap | 'DBRef';

// Colors used to render bson values both in the read-only and the editing
// state of a document.
const VALUE_COLOR_BY_THEME_AND_TYPE: Record<
  Theme,
  Partial<Record<BSONValueType, string>>
> = {
  [Themes.Dark]: {
    Int32: variantColors.dark[9],
    Int64: variantColors.dark[9],
    Double: variantColors.dark[9],
    Decimal128: variantColors.dark[9],
    Date: variantColors.dark[9],
    Boolean: variantColors.dark[10],
    String: variantColors.dark[7],
    ObjectId: variantColors.dark[5],
  },
  [Themes.Light]: {
    Int32: variantColors.light[9],
    Int64: variantColors.light[9],
    Double: variantColors.light[9],
    Decimal128: variantColors.light[9],
    Date: variantColors.light[9],
    Boolean: variantColors.light[10],
    String: variantColors.light[7],
    ObjectId: variantColors.light[5],
  },
} as const;

// This is the list of bson types to map to their corresponding label on the UI.
export const BSON_TYPE_LABEL: Partial<Record<keyof TypeCastMap, string>> = {
  Int64: 'Long',
  Decimal128: 'Decimal128',
  ObjectId: 'ObjectId',
  Date: 'ISODate',
  UUID: 'UUID',
  LegacyJavaUUID: 'LegacyJavaUUID',
  LegacyCSharpUUID: 'LegacyCSharpUUID',
  LegacyPythonUUID: 'LegacyPythonUUID',
} as const;

export function wrapValueWithBsonLabel(
  type: keyof TypeCastMap,
  value: string
): string {
  const label = BSON_TYPE_LABEL[type];
  if (!label) {
    return value;
  }
  return `${label}('${value}')`;
}

export function useBsonThemeStyles(type?: BSONValueType) {
  const darkMode = useDarkMode();
  return useMemo(() => {
    if (!type) {
      return;
    }
    return {
      color:
        VALUE_COLOR_BY_THEME_AND_TYPE[darkMode ? Themes.Dark : Themes.Light][
          type
        ],
    };
  }, [type, darkMode]);
}
