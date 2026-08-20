import type { TypeCastMap } from 'hadron-type-checker';

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
  return `${label}("${value}")`;
}
