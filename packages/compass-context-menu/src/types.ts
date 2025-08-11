export type ContextMenuItemGroup<T extends ContextMenuItem = ContextMenuItem> =
  {
    /** Label for the group used for telemetry. */
    telemetryLabel: string;
    items: T[];
  };

export type ContextMenuState<T extends ContextMenuItem = ContextMenuItem> = {
  isOpen: boolean;
  itemGroups: ContextMenuItemGroup<T>[];
  position: {
    x: number;
    y: number;
  };
};

export type ContextMenuWrapperProps<
  T extends ContextMenuItem = ContextMenuItem
> = {
  menu: ContextMenuState<T> & { close: () => void };
};

export type ContextMenuContextType = {
  close(): void;
};

export type ContextMenuItem = {
  label: string;
  onAction: (event: React.KeyboardEvent | React.MouseEvent) => void;
};
