/* eslint-disable filename-rules/match */

import type { ReactElement, ReactNode } from 'react';
import type { Either, HTMLElementProps } from '@leafygreen-ui/lib';

/**
 * Prop Enums & Types
 */

export const ComboboxElement = {
  Input: 'Input',
  ClearButton: 'ClearButton',
  FirstChip: 'FirstChip',
  LastChip: 'LastChip',
  MiddleChip: 'MiddleChip',
  Combobox: 'Combobox',
  Menu: 'Menu',
} as const;
export type ComboboxElement =
  typeof ComboboxElement[keyof typeof ComboboxElement];

/**
 * Prop types
 */

export const ComboboxSize = {
  // TODO: add XSmall & Small variants after the refresh
  // XSmall: 'xsmall',
  // Small: 'small',
  Default: 'default',
  Large: 'large',
} as const;
export type ComboboxSize = typeof ComboboxSize[keyof typeof ComboboxSize];

export const TruncationLocation = {
  start: 'start',
  middle: 'middle',
  end: 'end',
  none: 'none',
} as const;
export type TruncationLocation =
  typeof TruncationLocation[keyof typeof TruncationLocation];

export const Overflow = {
  /**
   * Combobox will be set to a fixed width, and will expand its height based on the number of Chips selected
   */
  expandY: 'expand-y',
  /**
   * Combobox will be set to a fixed height and width (default 100% of container). Chips will be scrollable left-right
   */
  scrollX: 'scroll-x',
  /**
   * @deprecated
   */
  expandX: 'expand-x',
} as const;
export type Overflow = typeof Overflow[keyof typeof Overflow];

export const State = {
  error: 'error',
  none: 'none',
} as const;
export type State = typeof State[keyof typeof State];

export const SearchState = {
  unset: 'unset',
  error: 'error',
  loading: 'loading',
} as const;
export type SearchState = typeof SearchState[keyof typeof SearchState];

/**
 * Generic Typing
 */

export type SelectValueType<M extends boolean> = M extends true
  ? Array<string>
  : string | null;

export type onChangeType<M extends boolean> = M extends true
  ? (value: SelectValueType<true>) => void
  : (value: SelectValueType<false>) => void;

// Returns the correct empty state for multiselcect / single select
export function getNullSelection<M extends boolean>(
  multiselect: M
): SelectValueType<M> {
  if (multiselect) {
    return [] as Array<string> as SelectValueType<M>;
  } else {
    return null as SelectValueType<M>;
  }
}

/**
 * Combobox Props
 */

export interface ComboboxMultiselectProps<M extends boolean> {
  /**
   * Defines whether a user can select multiple options, or only a single option.
   * When using TypeScript, `multiselect` affects the valid values of `initialValue`, `value`, and `onChange`
   */
  multiselect?: M;
  /**
   * The initial selection.
   * Must be a string (or array of strings) that matches the `value` prop of a `ComboboxOption`.
   * Changing the `initialValue` after initial render will not change the selection.
   */
  initialValue?: SelectValueType<M>;
  /**
   * A callback called when the selection changes.
   * Callback receives a single argument that is the new selection, either string, or string array
   */
  onChange?: onChangeType<M>;
  /**
   * The controlled value of the Combobox.
   * Must be a string (or array of strings) that matches the `value` prop of a `ComboboxOption`.
   * Changing `value` after initial render _will_ affect the selection.
   * `value` will always take precedence over `initialValue` if both are provided.
   */
  value?: SelectValueType<M>;

  /**
   * Defines the overflow behavior of a multiselect combobox.
   *
   * `expand-y`: Combobox has fixed width, and additional selections will cause the element to grow in the block direction.
   *
   * `expand-x`: Combobox has fixed height, and additional selections will cause the element to grow in the inline direction.
   *
   * `scroll-x`: Combobox has fixed height and width, and additional selections will cause the element to be scrollable in the x (horizontal) direction.
   */
  overflow?: M extends true ? Overflow : undefined;
}

export interface BaseComboboxProps
  extends Omit<HTMLElementProps<'div'>, 'onChange'> {
  /**
   * Defines the Combobox Options by passing children. Must be `ComboboxOption` or `ComboboxGroup`
   */
  children?: ReactNode;

  /**
   * An accessible label for the input, rendered in a <label> to the DOM
   */
  label?: string;

  /**
   * An accessible label for the input, used only for screen-readers
   */
  'aria-label'?: string;

  /**
   * A description for the input
   */
  description?: string;

  /**
   * A placeholder for the input element. Uses the native `placeholder` attribute.
   */
  placeholder?: string;

  /**
   * Disables all interaction with the component
   */
  disabled?: boolean;

  /**
   * Defines the visual size of the component
   */
  size?: ComboboxSize;

  /**
   * Toggles Dark Mode
   */
  darkMode?: boolean;

  /**
   * The error state of the component. Defines whether the error message is displayed.
   */
  state?: State;

  /**
   * The message shown below the input when state is `error`
   */
  errorMessage?: string;

  /**
   * The state of search results. Toggles search messages within the menu.
   */
  searchState?: SearchState;

  /**
   * A message shown within the menu when there are no options passed in as children, or `filteredOptions` is an empty array
   */
  searchEmptyMessage?: string;

  /**
   * A message shown within the menu when searchState is `error`
   */
  searchErrorMessage?: string;

  /**
   * A message shown within the menu when searchState is `loading`
   */
  searchLoadingMessage?: string;

  /**
   * A callback called when the search input changes.
   * Receives a single argument that is the current input value.
   * Use this callback to set `searchState` and/or `filteredOptions` appropriately
   */
  onFilter?: (value: string) => void;

  /**
   * Defines whether the Clear button appears to the right of the input.
   */
  clearable?: boolean;

  /**
   * A callback fired when the Clear button is pressed.
   * Fired _after_ `onChange`, and _before_ `onFilter`
   */
  onClear?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;

  /**
   * An array used to define which options are displayed.
   * Do not remove options from the JSX children, as this will affect the selected options
   */
  filteredOptions?: Array<string>;

  /**
   * Defines where the ellipses appear in a Chip when the length exceeds the `chipCharacterLimit`
   */
  chipTruncationLocation?: TruncationLocation;

  /**
   * Defined the character limit of a multiselect Chip before they start truncating.
   * Note: the three ellipses dots are included in the character limit.
   */
  chipCharacterLimit?: number;

  /**
   * Specifies that the popover content should be rendered at the end of the DOM,
   * rather than in the DOM tree.
   *
   * default: `true`
   */
  usePortal?: boolean;

  /**
   * When usePortal is `true`, specifies a class name to apply to the root element of the portal.
   */
  portalClassName?: undefined;

  /**
   * When usePortal is `true`, specifies an element to portal within. The default behavior is to generate a div at the end of the document to render within.
   */
  portalContainer?: null;

  /**
   * When usePortal is `true`, specifies the scrollable element to position relative to.
   */
  scrollContainer?: null;

  /**
   * Number that controls the z-index of the popover element directly.
   */
  popoverZIndex?: number;

  /**
   * Popover menu class name
   */
  popoverClassName?: string;
}

export type ComboboxProps<M extends boolean> = Either<
  BaseComboboxProps & ComboboxMultiselectProps<M>,
  'label' | 'aria-label'
>;

/**
 * Combobox Option Props
 */

interface BaseComboboxOptionProps {
  /**
   * The internal value of the option. Used as the identifier in Combobox `initialValue`, value and filteredOptions.
   * When undefined, this is set to `_.kebabCase(displayName)`
   */
  value?: string;

  /**
   * The display value of the option. Used as the rendered string within the menu and chips.
   * When undefined, this is set to `value`
   */
  displayName?: string;

  /**
   * The icon to display to the left of the option in the menu.
   */
  glyph?: ReactElement;

  /**
   * Defines whether the option is disabled.
   * Node: disabled options are still rendered in the menu, but not selectable.
   */
  disabled?: boolean;

  /**
   * Styling Prop
   */
  className?: string;

  /**
   * A description for the option.
   */
  description?: string;
}

export type ComboboxOptionProps = Either<
  BaseComboboxOptionProps,
  'value' | 'displayName'
>;

export interface OptionObject {
  value: string;
  displayName: string;
  isDisabled: boolean;
  hasGlyph?: boolean;
  description?: string;
}

export interface InternalComboboxOptionProps {
  value: string;
  displayName: string;
  isSelected: boolean;
  isFocused: boolean;
  setSelected: () => void;
  disabled?: boolean;
  glyph?: ReactElement;
  className?: string;
  index: number;
  description?: string;
}

/**
 * Combobox Group Props
 */

export interface ComboboxGroupProps {
  /**
   * Label for the group of options
   */
  label: string;

  /**
   * Options in the group. Must be one or more `ComboboxOption` components
   */
  children: React.ReactNode;

  /**
   * Styling prop
   */
  className?: string;
}

/**
 * Combobox Chip
 */

export interface ChipProps {
  displayName: string;
  isFocused: boolean;
  onRemove: () => void;
  onFocus: () => void;
}
