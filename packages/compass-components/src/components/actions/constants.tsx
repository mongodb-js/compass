export const ItemActionButtonSize = {
  XSmall: 'xsmall',
  Small: 'small',
  Default: 'default',
} as const;

export type ItemActionButtonSize =
  typeof ItemActionButtonSize[keyof typeof ItemActionButtonSize];
