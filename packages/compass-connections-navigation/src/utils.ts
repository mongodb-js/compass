import type { SidebarTreeItem } from './tree-data';

export const getTreeItemStyles = ({
  level,
  isExpandable,
}: Pick<SidebarTreeItem, 'isExpandable' | 'level'>): React.CSSProperties => {
  const defaultPadding = 20;
  const paddingLeft = (level - 1) * defaultPadding + (!isExpandable ? 30 : 0);
  return {
    paddingLeft,
  };
};
