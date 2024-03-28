import { Combobox as UnwrappedCombobox } from './Combobox';
import { withStackedComponentPopoverStyles } from '../../hooks/use-stacked-component';

const Combobox = withStackedComponentPopoverStyles(
  UnwrappedCombobox as any
) as typeof UnwrappedCombobox;

export { Combobox };
export { default as ComboboxGroup } from './ComboboxGroup';
export { ComboboxOption } from './ComboboxOption';
