import { createContext, useContext } from 'react';
import { pick } from 'lodash';

export const UiKitComponents = [
  'Accordion',
  'Banner',
  'BannerVariant',
  'Button',
  'ButtonVariant',
  'Cell',
  'Checkbox',
  'compassUIColors',
  'ConfirmationModal',
  'css',
  'cx',
  'Description',
  'Icon',
  'IconButton',
  'InlineDefinition',
  'FileInput',
  'Label',
  'Link',
  'Option',
  'OptionGroup',
  'RadioBox',
  'RadioBoxGroup',
  'Row',
  'Select',
  'spacing',
  'Tab',
  'Table',
  'TableHeader',
  'Tabs',
  'TextArea',
  'TextInput',
  'Toggle',
  'uiColors'
];

let UiKitContext: any;

export const createUiKitContext = (components: any) => {
  UiKitContext = createContext<any>(pick(components, UiKitComponents));
  console.log('1----------------------');
  console.log(UiKitContext);
  console.log('----------------------');
  return UiKitContext;
};

export const useUiKitContext = (): any => {
  if (!UiKitContext) {
    return;
  }
  return useContext(UiKitContext);
};

export default UiKitContext;