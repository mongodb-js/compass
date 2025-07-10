import {
  splitBySeparator,
  type ContextMenuItemGroup,
} from '@mongodb-js/compass-components';

import type { NavigationItemActions } from './item-actions';
import type { Actions } from './constants';
import type { SidebarActionableItem } from './tree-data';

export function itemActionsToContextMenuGroups(
  item: SidebarActionableItem,
  onItemAction: (item: SidebarActionableItem, action: Actions) => void,
  itemActions: NavigationItemActions
): ContextMenuItemGroup[] {
  return splitBySeparator<Actions>(itemActions).map((actions) =>
    actions.map(({ label, action }) => ({
      label,
      onAction() {
        onItemAction({ ...item, entrypoint: 'context-menu' }, action);
      },
    }))
  );
}
