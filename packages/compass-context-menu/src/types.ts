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
  T extends ContextMenuItem = ContextMenuItem,
> = {
  menu: ContextMenuState<T> & { close: () => void };
};

export type ContextMenuContextType = {
  close(): void;
};

export type ContextMenuItem = {
  /** if label contains sensitive data that shouldn't be used for telemetry, provide an alternative {@link trackingLabel} */
  label: string;
  /** use this parameter if the {@link label} itself can contain sensitive data */
  trackingLabel?: string;
  onAction?: (event: React.KeyboardEvent | React.MouseEvent) => void;
  items?: ContextMenuItem[];
};
