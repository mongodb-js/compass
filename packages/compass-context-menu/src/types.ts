export interface ContextMenuItemGroup {
  items: ContextMenuItem[];
  originListener: (event: MouseEvent) => void;
}

export type ContextMenuState =
  | {
      isOpen: false;
    }
  | {
      isOpen: true;
      itemGroups: ContextMenuItemGroup[];
      position: {
        x: number;
        y: number;
      };
    };

export type ContextMenuContext = {
  close(): void;
};

export type ContextMenuItem = {
  label: string;
  onAction: (event: React.KeyboardEvent | React.MouseEvent) => void;
};
