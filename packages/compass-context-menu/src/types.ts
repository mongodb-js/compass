export interface ContextMenuItemGroup {
  items: ContextMenuItem[];
  originListener: (event: MouseEvent) => void;
}

export type ContextMenuState = {
  isOpen: boolean;
  itemGroups: ContextMenuItemGroup[];
  position: {
    x: number;
    y: number;
  };
};

export type ContextMenuWrapperProps = {
  menu: ContextMenuState & { close: () => void };
};

export type ContextMenuContext = {
  close(): void;
};

export type ContextMenuItem = {
  label: string;
  onAction: (event: React.KeyboardEvent | React.MouseEvent) => void;
};
