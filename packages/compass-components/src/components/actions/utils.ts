import type {
  ItemActionGroupItem,
  ItemBase,
  ItemSeparator,
  MenuAction,
} from './types';

export function isSeparatorMenuAction(value: unknown): value is ItemSeparator {
  return (
    typeof value === 'object' &&
    value !== null &&
    'separator' in value &&
    value.separator === true
  );
}

export function isItemActionGroupItem<Action extends string>(
  value: unknown
): value is ItemActionGroupItem<Action> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'actions' in value &&
    Array.isArray(value.actions)
  );
}

export function actionTestId(dataTestId: string | undefined, action: string) {
  return dataTestId ? `${dataTestId}-${action}-action` : undefined;
}

export function splitBySeparator<Action extends string>(
  actions: (MenuAction<Action> | ItemActionGroupItem<Action>)[]
) {
  type Item = ItemBase<Action> | ItemActionGroupItem<Action>;
  const result: Item[][] = [];
  let currentGroup: Item[] = [];
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
