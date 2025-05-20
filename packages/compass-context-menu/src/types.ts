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

export type MenuItem = {
  label: string;
  onAction: (event: Event) => void;
};
