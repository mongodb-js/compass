import type { SidebarTreeItem } from './tree-data';
import { isExpandable } from './virtual-list/use-virtual-navigation-tree';

export const getTreeItemStyles = ({
  level,
  maxNestingLevel,
}: Pick<SidebarTreeItem, 'level' | 'maxNestingLevel'>): React.CSSProperties => {
  const _isExpandable = isExpandable({ level, maxNestingLevel });
  const defaultPadding = 20;
  const paddingLeft = (level - 1) * defaultPadding + (!_isExpandable ? 30 : 0);
  return {
    paddingLeft,
  };
};
