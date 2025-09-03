import type { ItemBase, ItemSeparator, MenuAction } from './types';

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

export function splitBySeparator<Action extends string>(
  actions: MenuAction<Action>[]
) {
  const result: ItemBase<Action>[][] = [];
  let currentGroup: ItemBase<Action>[] = [];
  for (const action of actions) {
    if (isSeparatorMenuAction(action)) {
      if (currentGroup.length > 0) {
        result.push(currentGroup);
        currentGroup = [];
      }
    } else {
      currentGroup.push(action);
    }
  }
  if (currentGroup.length > 0) {
    result.push(currentGroup);
  }
  return result;
}
