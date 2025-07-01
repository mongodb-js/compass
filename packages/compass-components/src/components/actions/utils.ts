import type { ItemSeparator, ItemAction, MenuAction } from './types';

export function isSeparatorMenuAction(value: unknown): value is ItemSeparator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'separator' in value &&
    value.separator === true
  );
}

export function actionTestId(dataTestId: string | undefined, action: string) {
  return dataTestId ? `${dataTestId}-${action}-action` : undefined;
}
