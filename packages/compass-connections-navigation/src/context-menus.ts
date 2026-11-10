import {
  splitBySeparator,
  type ContextMenuItemGroup,
} from '@mongodb-js/compass-components';

import type { NavigationItemActions } from './item-actions';
import type { ActionPayload, Actions } from './constants';
import type { SidebarActionableItem } from './tree-data';

export function itemActionsToContextMenuGroups(
  telemetryLabel: string,
  item: SidebarActionableItem,
  onItemAction: (
    item: SidebarActionableItem,
    action: Actions,
    actionPayload?: ActionPayload
  ) => void,
  itemActions: NavigationItemActions
): ContextMenuItemGroup[] {
  return splitBySeparator<Actions>(itemActions).map((actions) => ({
    telemetryLabel,
    items: actions.map(({ label, action, actions: subActions }) => ({
      label,
      onAction() {
        onItemAction({ ...item, entrypoint: 'context-menu' }, action);
      },
      items: subActions?.map(({ label, action, actionPayload }) => ({
        label,
        onAction() {
          onItemAction(
            { ...item, entrypoint: 'context-menu' },
            action,
            actionPayload as ActionPayload | undefined
          );
        },
      })),
    })),
  }));
}
