import type { SidebarTreeItem } from './tree-data';

export const getTreeItemStyles = ({
  level,
  maxNestingLevel,
}: Pick<SidebarTreeItem, 'level' | 'maxNestingLevel'>): React.CSSProperties => {
  const isExpandable = level < maxNestingLevel;
  const defaultPadding = 20;
  return {
    paddingLeft: (level - 1) * defaultPadding + (!isExpandable ? 30 : 0),
  };
};
