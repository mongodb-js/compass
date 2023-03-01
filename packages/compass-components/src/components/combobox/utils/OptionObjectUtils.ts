import { OptionObject } from '../Combobox.types';
/**
 *
 * @param value
 * @param options
 * @internal
 */
export const getOptionObjectFromValue = (
  value: string | null,
  options: Array<OptionObject>
): OptionObject | undefined => {
  if (value) return options.find((opt) => opt.value === value);
};

/**
 *
 * @param value
 * @param options
 * @internal
 */
export const getDisplayNameForValue = (
  value: string | null,
  options: Array<OptionObject>
): string => {
  return value
    ? getOptionObjectFromValue(value, options)?.displayName ?? value
    : '';
};

/**
 *
 * @param value
 * @param options
 * @internal
 */
export const getValueForDisplayName = (
  displayName: string | null,
  options: Array<OptionObject>
): string => {
  return displayName
    ? options.find((opt) => opt.displayName === displayName)?.value ??
        displayName
    : '';
};
