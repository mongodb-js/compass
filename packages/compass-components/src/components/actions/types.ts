import type { glyphs } from '@leafygreen-ui/icon';

import type { ItemActionButtonSize } from './constants';

type ItemCommon<Action extends string> = {
  label: string;
  icon?: React.ReactChild;
  variant?: 'default' | 'destructive';
  isDisabled?: boolean;
  disabledDescription?: string;
  tooltip?: string;
  className?: string;
  /**
   * How to show the item when not collapsed into the menu.
   * @default ItemActionButton
   */
  expandedAs?: React.ComponentType<ItemComponentProps<Action>>;
};

export type ItemBase<Action extends string> = ItemCommon<Action> & {
  action: Action;
  actionPayload?: unknown;
  actions?: never;
};

/**
 * An item whose only purpose is to pick one of its nested actions. Rendered
 * as a submenu inside a menu, or as a dropdown menu when rendered inline.
 */
export type ItemActionGroupItem<Action extends string> = ItemCommon<Action> & {
  action?: never;
  actionPayload?: never;
  actions: (ItemBase<Action> | ItemSeparator)[];
};

export type ItemComponentProps<Action extends string> = Omit<
  ItemBase<Action>,
  'expandedAs'
> & {
  // TODO: Rename to "size"
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  'data-testid'?: string;
  onClick: (evt: React.MouseEvent<HTMLElement>) => void;
  setHidable?(hidable: boolean): void;
};

export type ItemAction<Action extends string> = {
  icon: keyof typeof glyphs | React.ReactElement;
} & (ItemBase<Action> | ItemActionGroupItem<Action>);

export type ItemSeparator = { separator: true };

export type MenuAction<Action extends string> =
  ItemBase<Action> | ItemSeparator;
