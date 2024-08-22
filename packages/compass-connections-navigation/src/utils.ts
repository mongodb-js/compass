import { spacing } from '@mongodb-js/compass-components';
import type { SidebarTreeItem } from './tree-data';

export const getTreeItemStyles = ({
  level,
  isExpandable,
}: Pick<SidebarTreeItem, 'isExpandable' | 'level'>): React.CSSProperties => {
  const DEFAULT_PADDING = spacing[400];
  const EXPAND_ICON_WIDTH = spacing[400];
  const EXPAND_ICON_GAP = spacing[50];
  const EXPAND_ICON_SIZE = EXPAND_ICON_WIDTH + EXPAND_ICON_GAP;
  return {
    paddingLeft:
      DEFAULT_PADDING +
      (!isExpandable ? EXPAND_ICON_SIZE : 0) +
      (level - 1) * EXPAND_ICON_SIZE,
  };
};
