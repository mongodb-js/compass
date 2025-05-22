export type MenuState =
  | {
      isOpen: false;
    }
  | {
      isOpen: true;
      children: React.ReactNode;
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
