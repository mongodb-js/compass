import type { glyphs } from '@leafygreen-ui/icon';

import type { ItemActionButtonSize } from './constants';

export type ItemBase<Action extends string> = {
  action: Action;
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

export type ItemComponentProps<Action extends string> = Omit<
  ItemBase<Action>,
  'expandedAs'
> & {
  // TODO: Rename to "size"
  iconSize?: ItemActionButtonSize;
  iconClassName?: string;
  iconStyle?: React.CSSProperties;
  'data-testid'?: string;
  onClick(evt: React.MouseEvent<unknown>): void;
};

export type ItemAction<Action extends string> = {
  icon: keyof typeof glyphs | React.ReactElement;
} & ItemBase<Action>;

export type ItemSeparator = { separator: true };
